/**
 * API utility functions
 */

export const createApiUrl = (baseUrl: string, endpoint: string): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanBase}/${cleanEndpoint}`;
};

export const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const handleApiError = (
  error: any
): { message: string; status?: number } => {
  return {
    message: getErrorMessage(error),
    status: error?.response?.status,
  };
};

export const formatApiResponse = <T>(
  data: T,
  message?: string
): { data: T; message?: string; success: boolean } => {
  return {
    data,
    message,
    success: true,
  };
};

export const formatApiError = (
  message: string,
  status?: number
): { error: string; success: boolean; status?: number } => {
  return {
    error: message,
    success: false,
    ...(status && { status }),
  };
};
