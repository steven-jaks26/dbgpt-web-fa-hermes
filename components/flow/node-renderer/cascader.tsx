import { IFlowNodeParameter } from '@/types/flow';
import i18n from '@/app/i18n';
import { convertKeysToCamelCase } from '@/utils/flow';
import { Cascader } from 'antd';

export const renderCascader = (data: IFlowNodeParameter) => {
  const attr = convertKeysToCamelCase(data.ui?.attr || {});

  return <Cascader {...attr} options={data.options} placeholder={i18n.t('please_choose')} className='w-full nodrag' />;
};
