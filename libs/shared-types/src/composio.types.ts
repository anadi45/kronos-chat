export interface ConnectedAccount {
  account_id: string;
  status: string;
  provider: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConnectionRequest {
  connection_id: string;
  redirect_url: string;
  status: string;
}

export interface AuthConfig {
  id: string;
  uuid: string;
  name: string;
  type: string;
  toolkit: any;
  status: string;
  no_of_connections: number;
  auth_scheme: string;
  is_composio_managed: boolean;
  created_at?: string;
  last_updated_at?: string;
}

export interface Toolkit {
  slug: string;
  name: string;
  description: string;
  logo: string;
  categories: string[];
  auth_schemes: string[];
}

export interface ToolkitAction {
  name: string;
  display_name: string;
  description: string;
  parameters: any;
  response: any;
  app_name: string;
}

export interface InitiateConnectionDto {
  provider: string;
  callback_url?: string;
  scope?: string[];
}

export interface ExecuteToolDto {
  action_name: string;
  params?: Record<string, any>;
  connected_account_id?: string;
}
