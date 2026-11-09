import { IFlowNodeParameter } from '@/types/flow';
import i18n from '@/app/i18n';
import { convertKeysToCamelCase } from '@/utils/flow';
import { Select } from 'antd';

export const renderSelect = (data: IFlowNodeParameter) => {
  const attr = convertKeysToCamelCase(data?.ui?.attr || {});

  return <Select {...attr} className='w-full nodrag' placeholder={i18n.t('please_choose')} options={data.options} />;
};
