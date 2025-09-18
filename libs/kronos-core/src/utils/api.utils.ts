/**
 * API utility functions
 */

export const createApiUrl = (baseUrl: string, endpoint: string): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanBase}/${cleanEndpoint}`;
};

export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const responseError = error as { response?: { data?: { message?: string } } };
    if (responseError.response?.data?.message) {
      return responseError.response.data.message;
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const messageError = error as { message: string };
    return messageError.message;
  }
  return 'An unexpected error occurred';
};

export const handleApiError = (
  error: unknown
): { message: string; status?: number } => {
  const responseError = error as { response?: { status?: number } };
  return {
    message: getErrorMessage(error),
    status: responseError.response?.status,
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
