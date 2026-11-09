import { notification } from 'antd';
import { AxiosError } from 'axios';
import i18n from '@/app/i18n';
import { ApiResponse, FailedTuple, ResponseType, SuccessTuple } from '../';

/**
 * Response processing
 *
 * @param promise request
 * @param ignoreCodes ignore error codes
 * @returns
 */
export const apiInterceptors = <T = any, D = any>(
  promise: Promise<ApiResponse<T, D>>,
  ignoreCodes?: '*' | (number | string)[],
) => {
  return promise
    .then<SuccessTuple<T, D>>(response => {
      const { data } = response;
      if (!data) {
        throw new Error(i18n.t('network_error'));
      }
      if (!data.success) {
        if (ignoreCodes === '*' || (data.err_code && ignoreCodes && ignoreCodes.includes(data.err_code))) {
          return [null, data.data, data, response];
        } else {
          notification.error({
            message: i18n.t('request.error.default', { status: data?.err_code ?? '—' }),
            description: data?.err_msg ?? i18n.t('chat_error'),
          });
        }
      }
      return [null, data.data, data, response];
    })
    .catch<FailedTuple<T, D>>((err: Error | AxiosError<T, D>) => {
      let errMessage = err.message;
      if (err instanceof AxiosError) {
        try {
          const { err_msg } = JSON.parse(err.request.response) as ResponseType<null>;
          err_msg && (errMessage = err_msg);
        } catch {
          /* empty */
        }
      }
      notification.error({
        message: i18n.t('request.error.default', { status: err instanceof AxiosError ? err.response?.status ?? '—' : '—' }),
        description: errMessage,
      });
      return [err, null, null, null];
    });
};
