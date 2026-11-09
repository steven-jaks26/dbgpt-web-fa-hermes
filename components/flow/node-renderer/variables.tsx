import { IFlowNodeParameter } from '@/types/flow';
import i18n from '@/app/i18n';
import { convertKeysToCamelCase } from '@/utils/flow';
import { Input } from 'antd';

export const renderVariables = (data: IFlowNodeParameter) => {
  const attr = convertKeysToCamelCase(data.ui?.attr || {});

  return <Input {...attr} className='w-full' placeholder={i18n.t('Please_Input')} allowClear />;
};
