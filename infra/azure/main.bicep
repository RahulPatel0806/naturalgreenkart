// ─────────────────────────────────────────────────────────────────────────────
// Aggrimart — Azure infrastructure (Bicep)
// Provisions: PostgreSQL Flexible Server, Storage Account (Blob), Container
// Registry, Linux App Service Plan + Web App for Containers, Log Analytics.
//
// Deploy:
//   az group create -n aggrimart-rg -l centralindia
//   az deployment group create -g aggrimart-rg -f infra/azure/main.bicep \
//     -p pgAdminPassword=<strong-pwd> jwtAccessSecret=<s> jwtRefreshSecret=<s>
// ─────────────────────────────────────────────────────────────────────────────

@description('Deployment location')
param location string = resourceGroup().location

@description('Base name prefix for all resources')
param namePrefix string = 'aggrimart'

@description('PostgreSQL administrator login')
param pgAdminUser string = 'aggriadmin'

@secure()
@description('PostgreSQL administrator password')
param pgAdminPassword string

@secure()
param jwtAccessSecret string

@secure()
param jwtRefreshSecret string

@description('Container image to deploy (registry/name:tag)')
param containerImage string = '${namePrefix}acr.azurecr.io/aggrimart-backend:latest'

var pgServerName = '${namePrefix}-pg'
var pgDatabaseName = 'aggrimart'
var storageName = '${namePrefix}stor${uniqueString(resourceGroup().id)}'
var acrName = '${namePrefix}acr'
var planName = '${namePrefix}-plan'
var webAppName = '${namePrefix}-api'
var logName = '${namePrefix}-logs'

// ── Observability ────────────────────────────────────────────────────────────
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ── PostgreSQL Flexible Server ───────────────────────────────────────────────
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: pgServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: pgAdminUser
    administratorLoginPassword: pgAdminPassword
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
  }
}

resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgres
  name: pgDatabaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure services (App Service) to reach PostgreSQL.
resource pgFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ── Storage (Blob for product images) ────────────────────────────────────────
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource imagesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'product-images'
  properties: { publicAccess: 'Blob' }
}

// ── Container Registry ───────────────────────────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: true }
}

// ── App Service Plan + Web App ───────────────────────────────────────────────
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: { name: 'B1', tier: 'Basic' }
  kind: 'linux'
  properties: { reserved: true }
}

var storageKey = storage.listKeys().keys[0].value
var storageConnString = 'DefaultEndpointsProtocol=https;AccountName=${storageName};AccountKey=${storageKey};EndpointSuffix=${environment().suffixes.storage}'
var databaseUrl = 'postgresql://${pgAdminUser}:${pgAdminPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/${pgDatabaseName}?sslmode=require'

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
      alwaysOn: true
      healthCheckPath: '/api/health'
      ftpsState: 'Disabled'
      appSettings: [
        { name: 'WEBSITES_PORT', value: '4000' }
        { name: 'DOCKER_REGISTRY_SERVER_URL', value: 'https://${acrName}.azurecr.io' }
        { name: 'DOCKER_REGISTRY_SERVER_USERNAME', value: acr.listCredentials().username }
        { name: 'DOCKER_REGISTRY_SERVER_PASSWORD', value: acr.listCredentials().passwords[0].value }
        { name: 'NODE_ENV', value: 'production' }
        { name: 'PORT', value: '4000' }
        { name: 'DATABASE_URL', value: databaseUrl }
        { name: 'JWT_ACCESS_SECRET', value: jwtAccessSecret }
        { name: 'JWT_REFRESH_SECRET', value: jwtRefreshSecret }
        { name: 'OTP_DEV_MODE', value: 'false' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: storageConnString }
        { name: 'AZURE_STORAGE_ACCOUNT_NAME', value: storageName }
        { name: 'AZURE_STORAGE_CONTAINER', value: 'product-images' }
        { name: 'AZURE_BLOB_PUBLIC_BASE_URL', value: '${storage.properties.primaryEndpoints.blob}product-images' }
        { name: 'CORS_ALLOWED_ORIGINS', value: '' }
      ]
    }
  }
}

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output postgresFqdn string = postgres.properties.fullyQualifiedDomainName
output acrLoginServer string = acr.properties.loginServer
output blobBaseUrl string = '${storage.properties.primaryEndpoints.blob}product-images'
