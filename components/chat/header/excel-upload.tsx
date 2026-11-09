import { ChatContext } from '@/app/chat-context';
import { apiInterceptors, postChatModeParamsFileLoad } from '@/client/api';
import { ChatContentContext } from '@/pages/chat';
import { LinkOutlined, SelectOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Tooltip, Upload, UploadFile, UploadProps, message } from 'antd';
import { PropsWithChildren, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  convUid: string;
  chatMode: string;
  onComplete?: () => void;
}

function ExcelUpload({ convUid, chatMode, onComplete, ...props }: PropsWithChildren<Props & UploadProps>) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [percent, setPercent] = useState<number>();
  const { model } = useContext(ChatContext);

  const { temperatureValue, maxNewTokensValue } = useContext(ChatContentContext);

  const onChange: UploadProps['onChange'] = async info => {
    if (!info) {
      message.error(t('select_spreadsheet_file'));
      return;
    }
    if (!/\.(csv|xlsx|xls)$/.test(info.file.name ?? '')) {
      message.error(t('spreadsheet_type_invalid'));
      return;
    }

    setFileList([info.file]);
  };

  const onUpload = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('doc_file', fileList[0] as any);
      messageApi.open({ content: `${t('uploading')} ${fileList[0].name}`, type: 'loading', duration: 0 });
      const [err] = await apiInterceptors(
        postChatModeParamsFileLoad({
          convUid,
          chatMode,
          data: formData,
          model,
          temperatureValue,
          maxNewTokensValue,
          config: {
            /** timeout 1h */
            timeout: 1000 * 60 * 60,
            onUploadProgress: progressEvent => {
              const progress = Math.ceil((progressEvent.loaded / (progressEvent.total || 0)) * 100);
              setPercent(progress);
            },
          },
        }),
      );
      if (err) return;
      message.success(t('success'));
      onComplete?.();
    } catch (e: any) {
      message.error(e?.message || t('upload_error'));
    } finally {
      setLoading(false);
      messageApi.destroy();
    }
  };

  return (
    <>
      <div className='flex items-start gap-2'>
        {contextHolder}
        <Tooltip placement='bottom' title={t('file_immutable_after_upload')}>
          <Upload
            disabled={loading}
            className='mr-1'
            beforeUpload={() => false}
            fileList={fileList}
            name='file'
            accept='.csv,.xlsx,.xls'
            multiple={false}
            onChange={onChange}
            showUploadList={{
              showDownloadIcon: false,
              showPreviewIcon: false,
              showRemoveIcon: false,
            }}
            itemRender={() => <></>}
            {...props}
          >
            <Button
              className='flex justify-center items-center'
              type='primary'
              disabled={loading}
              icon={<SelectOutlined />}
            >
              {t('select_file')}
            </Button>
          </Upload>
        </Tooltip>
        <Button
          type='primary'
          loading={loading}
          className='flex justify-center items-center'
          disabled={!fileList.length}
          icon={<UploadOutlined />}
          onClick={onUpload}
        >
          {loading ? (percent === 100 ? t('analysis') : t('uploading')) : t('upload')}
        </Button>
        {!!fileList.length && (
          <div className='mt-2 text-gray-500 text-sm flex items-center' onClick={() => setFileList([])}>
            <LinkOutlined className='mr-2' />
            <span>{fileList[0]?.name}</span>
          </div>
        )}
      </div>
    </>
  );
}

export default ExcelUpload;
