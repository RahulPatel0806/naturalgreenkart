import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  Tabs: NavigatorScreenParams<CustomerTabParamList>;
  ProductList: { categoryId?: string; categoryName?: string; search?: string };
  ProductDetails: { id: string };
  Checkout: undefined;
  OrderDetails: { id: string };
  Addresses: undefined;
  Notifications: undefined;
  EditProfile: undefined;
};

export type SellerTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  SellerOrders: undefined;
};

export type SellerStackParamList = {
  SellerTabs: NavigatorScreenParams<SellerTabParamList>;
  SellerOrderDetails: { id: string };
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  Catalog: undefined;
  Users: undefined;
  AdminOrders: undefined;
};

export type AdminStackParamList = {
  AdminTabs: NavigatorScreenParams<AdminTabParamList>;
  /** Create when no id; edit when id present. */
  AdminProductForm: { id?: string } | undefined;
  AdminCategories: undefined;
  AdminCategoryForm: { id?: string } | undefined;
};
