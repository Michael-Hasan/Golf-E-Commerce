import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { AppLogger } from '../../logging/logger.service';

type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
};

@Catch()
export class GlobalExceptionFilter
  implements ExceptionFilter, GqlExceptionFilter
{
  private readonly logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger.withContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): unknown {
    if (host.getType<'http' | 'graphql'>() === 'graphql') {
      return this.handleGraphql(exception, host);
    }

    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest<{ originalUrl?: string; url?: string }>();
    const errorBody = this.buildErrorBody(
      exception,
      request?.originalUrl || request?.url || 'unknown',
    );

    this.logException(exception, errorBody);
    response.status(errorBody.statusCode).json(errorBody);
  }

  private handleGraphql(exception: unknown, host: ArgumentsHost): GraphQLError {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext<{ req?: { originalUrl?: string; url?: string } }>();
    const info = gqlHost.getInfo();
    const path = context?.req?.originalUrl || context?.req?.url || info?.fieldName || 'graphql';
    const errorBody = this.buildErrorBody(exception, path);

    this.logException(exception, errorBody);

    return new GraphQLError(
      Array.isArray(errorBody.message)
        ? errorBody.message.join(', ')
        : errorBody.message,
      {
        path: info?.path ? [String(info.path.key)] : undefined,
        extensions: {
          ...errorBody,
        },
      },
    );
  }

  private buildErrorBody(exception: unknown, path: string): ErrorBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const responseBody =
        typeof response === 'string'
          ? { message: response, error: exception.name }
          : (response as Record<string, unknown>);

      return {
        statusCode,
        message:
          (responseBody.message as string | string[] | undefined) ??
          exception.message,
        error:
          (responseBody.error as string | undefined) ??
          exception.name ??
          this.resolveErrorName(statusCode),
        timestamp,
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
      timestamp,
      path,
    };
  }

  private logException(exception: unknown, errorBody: ErrorBody): void {
    if (exception instanceof Error) {
      this.logger.error(exception.message, {
        ...errorBody,
        stack: exception.stack,
      });
      return;
    }

    this.logger.error('Unhandled exception', errorBody);
  }

  private resolveErrorName(statusCode: number): string {
    return HttpStatus[statusCode] ?? 'Error';
  }
}
