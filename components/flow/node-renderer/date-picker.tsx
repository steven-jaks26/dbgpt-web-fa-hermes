import { IFlowNodeParameter } from '@/types/flow';
import i18n from '@/app/i18n';
import { convertKeysToCamelCase } from '@/utils/flow';
import type { DatePickerProps } from 'antd';
import { DatePicker } from 'antd';

type Props = {
  formValuesChange: any;
  data: IFlowNodeParameter;
  onChange?: (value: any) => void;
};
export const renderDatePicker = (params: Props) => {
  const { data, formValuesChange } = params;
  const attr = convertKeysToCamelCase(data.ui?.attr || {});

  const onChange: DatePickerProps['onChange'] = (_, dateString) => {
    formValuesChange({
      [data.name]: dateString,
    });
  };

  return <DatePicker onChange={onChange} {...attr} className='w-full' placeholder={i18n.t('please_choose')} />;
};
