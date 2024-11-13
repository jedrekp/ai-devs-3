import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HttpClientService {
  constructor(private readonly httpService: HttpService) {}

  async get(url: string): Promise<any> {
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async post(url: string, data: object): Promise<any> {
    try {
      const response = await firstValueFrom(this.httpService.post(url, data));
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async submitFormData(url: string, data: object): Promise<any> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return this.post(url, formData);
  }

  private handleError(error: any): void {
    if (error.response) {
      const { status, data } = error.response;
      throw new HttpException(
        `Request failed with status ${status}: ${data?.message || JSON.stringify(data)}`,
        status,
      );
    } else {
      throw new HttpException(`Request failed: ${error.message}`, 500);
    }
  }
}
