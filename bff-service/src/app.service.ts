import { HttpStatus, Injectable, Req, Res } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';

const CACHE_TIMEOUT = 120000;

@Injectable()
export class AppService {
  cachedProducts: any;

  getHello(): string {
    return 'Hello World!';
  }

  async proxyRequest(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const { method, query, body, headers, params} = req;
    const { authorization } = headers;

    const serviceURL = process.env[params.service];

    if (!serviceURL) {
      return res.status(HttpStatus.BAD_GATEWAY).json({ error: 'Path not found' });
    }

    const remainingPath = query.id || '';

    let axiosConfig: AxiosRequestConfig = {
      method,
      params: query,
      headers: {
        authorization,
      },
      url: `${serviceURL}/${remainingPath}`,
    }

    if ((method === 'POST' || method === 'PUT') && body) {
      axiosConfig.data = body;
    }

    try {
      if (params.service === 'product' && method === 'GET' && Object.keys(query).length === 0) {
        const products = await this.getAllProducts(axiosConfig);
        res.status(HttpStatus.OK).json(products);
        return;
      }
      const response = await axios(axiosConfig);
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response.status).json(error.response.data);
    }
  }

  private async getAllProducts(axiosConfig: AxiosRequestConfig): Promise<any> {
    if (this.cachedProducts) {
      return this.cachedProducts;
    }
    const response = await axios(axiosConfig);
    this.cachedProducts = response.data;
    setTimeout(() => {
      this.cachedProducts = null;
    }, CACHE_TIMEOUT);
    return this.cachedProducts;
  }
}