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
};

export type SellerTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  SellerOrders: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  Users: undefined;
  AdminOrders: undefined;
};
