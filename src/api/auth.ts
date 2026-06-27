import apiClient from './httpClient'

export interface CurrentUserPermissionsResponse {
  code: number
  data: {
    permissions: string[]
  }
}

export class AuthService {
  static async getCurrentUserPermissions(): Promise<CurrentUserPermissionsResponse> {
    const resp = await apiClient.get<CurrentUserPermissionsResponse>('/auth/permissions')
    return resp.data
  }
}
