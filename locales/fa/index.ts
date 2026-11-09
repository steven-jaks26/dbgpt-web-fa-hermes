// Persian locale entry point.
//
// The key set intentionally starts from the English catalog so adding a new
// key cannot silently break the Persian bundle. Individual strings are
// replaced by Persian translations as the catalog is completed; the language
// propagation and RTL plumbing do not depend on a duplicated key list.
import en from '../en';
import { ChatEn } from '../en/chat';
import { CommonEn } from '../en/common';
import { FlowEn } from '../en/flow';
import { ObservabilityEn } from '../en/observability';
import { ChatFa } from './chat';
import { CommonFa } from './common';
import { FlowFa } from './flow';
import { ObservabilityFa } from './observability';

// پوشش فارسی برای کلیدهایی که تازه به کاتالوگ انگلیسی افزوده می‌شوند.
// ترجمه‌های دقیقِ فایل‌های fa در ادامه روی این لایه قرار می‌گیرند.
const phraseMap: Array<[string, string]> = [
  ['Please select', 'لطفاً انتخاب کنید'], ['Please enter', 'لطفاً وارد کنید'], ['Please input', 'لطفاً وارد کنید'],
  ['Please choose', 'لطفاً انتخاب کنید'], ['Select or input', 'انتخاب یا وارد کردن'], ['Select', 'انتخاب'],
  ['Search', 'جست‌وجو'], ['No matching', 'مورد مطابقی وجود ندارد'], ['No data', 'داده‌ای وجود ندارد'],
  ['No results', 'نتیجه‌ای وجود ندارد'], ['No ', 'بدون '], ['Add', 'افزودن'], ['Edit', 'ویرایش'], ['Delete', 'حذف'],
  ['Cancel', 'لغو'], ['Save', 'ذخیره'], ['Create', 'ایجاد'], ['Update', 'به‌روزرسانی'], ['Refresh', 'تازه‌سازی'],
  ['Upload', 'بارگذاری'], ['Download', 'بارگیری'], ['Copy', 'کپی'], ['Close', 'بستن'], ['Open', 'بازکردن'],
  ['Back', 'بازگشت'], ['Next', 'بعدی'], ['Finish', 'پایان'], ['Retry', 'تلاش دوباره'], ['Reset', 'بازنشانی'],
  ['Success', 'موفق'], ['Failed', 'ناموفق'], ['Error', 'خطا'], ['Warning', 'هشدار'], ['Loading', 'در حال بارگذاری'],
  ['Running', 'در حال اجرا'], ['Completed', 'تکمیل‌شده'], ['Active', 'فعال'], ['Inactive', 'غیرفعال'], ['Enabled', 'فعال'], ['Disabled', 'غیرفعال'],
  ['Name', 'نام'], ['Description', 'توضیحات'], ['Details', 'جزئیات'], ['Status', 'وضعیت'], ['Type', 'نوع'], ['Value', 'مقدار'],
  ['Model', 'مدل'], ['Provider', 'ارائه‌دهنده'], ['Database', 'پایگاه داده'], ['Knowledge Base', 'پایگاه دانش'], ['Knowledge', 'دانش'],
  ['File', 'فایل'], ['Files', 'فایل‌ها'], ['Document', 'سند'], ['Documents', 'اسناد'], ['Folder', 'پوشه'], ['Directory', 'پوشه'],
  ['Task', 'کار'], ['Tasks', 'کارها'], ['Question', 'پرسش'], ['Answer', 'پاسخ'], ['Result', 'نتیجه'], ['Results', 'نتایج'],
  ['Report', 'گزارش'], ['Summary', 'خلاصه'], ['Overview', 'نمای کلی'], ['Details', 'جزئیات'], ['Content', 'محتوا'],
  ['Input', 'ورودی'], ['Output', 'خروجی'], ['Parameters', 'پارامترها'], ['Parameter', 'پارامتر'], ['Configuration', 'پیکربندی'],
  ['Settings', 'تنظیمات'], ['Advanced', 'پیشرفته'], ['Required', 'الزامی'], ['Optional', 'اختیاری'], ['Default', 'پیش‌فرض'],
  ['Current', 'فعلی'], ['Total', 'مجموع'], ['Count', 'تعداد'], ['Time', 'زمان'], ['Date', 'تاریخ'], ['Duration', 'مدت‌زمان'],
  ['History', 'سابقه'], ['Execution', 'اجرا'], ['Run', 'اجرا'], ['View', 'مشاهده'], ['Show', 'نمایش'], ['Hide', 'پنهان‌کردن'],
  ['All', 'همه'], ['None', 'هیچ‌کدام'], ['More', 'بیشتر'], ['Less', 'کمتر'], ['New', 'جدید'], ['Public', 'عمومی'], ['Private', 'خصوصی'],
  ['Connection', 'اتصال'], ['Connector', 'اتصال‌دهنده'], ['Communication', 'ارتباطات'], ['Search tools', 'ابزارهای جست‌وجو'],
  ['Scheduled Tasks', 'کارهای زمان‌بندی‌شده'], ['Execution history', 'سابقهٔ اجرا'], ['Cron expression', 'عبارت Cron'],
  ['Hourly', 'ساعتی'], ['Daily', 'روزانه'], ['Weekly', 'هفتگی'], ['Monthly', 'ماهانه'], ['Custom', 'دلخواه'],
  ['Monday', 'دوشنبه'], ['Tuesday', 'سه‌شنبه'], ['Wednesday', 'چهارشنبه'], ['Thursday', 'پنجشنبه'], ['Friday', 'جمعه'], ['Saturday', 'شنبه'], ['Sunday', 'یکشنبه'],
  ['Today', 'امروز'], ['Yesterday', 'دیروز'], ['Official', 'رسمی'], ['Personal', 'شخصی'], ['Template', 'قالب'], ['Preview', 'پیش‌نمایش'],
  ['Web report', 'گزارش وب'], ['Data table', 'جدول داده'], ['Chart', 'نمودار'], ['Image', 'تصویر'], ['Code', 'کد'], ['Document', 'سند'],
  ['Semantic search', 'جست‌وجوی معنایی'], ['Search content', 'جست‌وجوی محتوا'], ['Find files', 'یافتن فایل‌ها'], ['Read file', 'خواندن فایل'],
  ['List files', 'فهرست فایل‌ها'], ['Run command', 'اجرای فرمان'], ['Edit file', 'ویرایش فایل'], ['Write file', 'نوشتن فایل'],
  ['Try again', 'دوباره تلاش کنید'], ['Please wait', 'لطفاً صبر کنید'], ['Coming soon', 'به‌زودی'], ['Needs attention', 'نیازمند توجه'],
  ['Network error', 'خطای شبکه'], ['Request failed', 'درخواست ناموفق بود'], ['Connection error', 'خطای اتصال'],
];

const wordMap: Record<string, string> = {
  the: 'این', a: 'یک', an: 'یک', and: 'و', or: 'یا', of: 'ِ', to: 'به', for: 'برای', from: 'از', in: 'در', on: 'روی', with: 'با',
  is: 'است', are: 'هستند', was: 'بود', be: 'باشد', can: 'می‌تواند', cannot: 'نمی‌تواند', not: 'نیست', your: 'شما', this: 'این', that: 'آن',
  please: 'لطفاً', enter: 'وارد کنید', input: 'ورودی', select: 'انتخاب', choose: 'انتخاب', name: 'نام', description: 'توضیحات',
  data: 'داده', file: 'فایل', files: 'فایل‌ها', document: 'سند', documents: 'اسناد', model: 'مدل', models: 'مدل‌ها', provider: 'ارائه‌دهنده',
  database: 'پایگاه داده', databases: 'پایگاه‌های داده', knowledge: 'دانش', base: 'پایه', task: 'کار', tasks: 'کارها', question: 'پرسش',
  answer: 'پاسخ', result: 'نتیجه', results: 'نتایج', report: 'گزارش', reports: 'گزارش‌ها', content: 'محتوا', value: 'مقدار', values: 'مقادیر',
  status: 'وضعیت', type: 'نوع', size: 'اندازه', count: 'تعداد', total: 'مجموع', time: 'زمان', date: 'تاریخ', duration: 'مدت‌زمان',
  create: 'ایجاد', created: 'ایجادشده', update: 'به‌روزرسانی', updated: 'به‌روزرسانی‌شده', delete: 'حذف', add: 'افزودن', edit: 'ویرایش',
  save: 'ذخیره', cancel: 'لغو', close: 'بستن', open: 'بازکردن', back: 'بازگشت', next: 'بعدی', finish: 'پایان', retry: 'تلاش دوباره', reset: 'بازنشانی',
  upload: 'بارگذاری', uploaded: 'بارگذاری‌شده', download: 'بارگیری', copied: 'کپی‌شده', copy: 'کپی', search: 'جست‌وجو', show: 'نمایش', hide: 'پنهان‌کردن',
  all: 'همه', no: 'بدون', none: 'هیچ‌کدام', more: 'بیشتر', less: 'کمتر', new: 'جدید', public: 'عمومی', private: 'خصوصی', active: 'فعال', inactive: 'غیرفعال',
  enabled: 'فعال', disabled: 'غیرفعال', required: 'الزامی', optional: 'اختیاری', default: 'پیش‌فرض', current: 'فعلی', available: 'در دسترس',
  success: 'موفق', failed: 'ناموفق', failure: 'شکست', error: 'خطا', warning: 'هشدار', loading: 'در حال بارگذاری', running: 'در حال اجرا', completed: 'تکمیل‌شده',
  processing: 'در حال پردازش', execution: 'اجرا', execute: 'اجرا کردن', view: 'مشاهده', details: 'جزئیات', overview: 'نمای کلی', summary: 'خلاصه',
  output: 'خروجی', parameter: 'پارامتر', parameters: 'پارامترها', configuration: 'پیکربندی', settings: 'تنظیمات', advanced: 'پیشرفته',
  searcher: 'جست‌وجوگر', directory: 'پوشه', folder: 'پوشه', source: 'منبع', target: 'هدف', method: 'روش', strategy: 'راهبرد', pattern: 'الگو',
  first: 'اولین', last: 'آخرین', only: 'فقط', based: 'بر اساس', using: 'با استفاده از', click: 'کلیک', start: 'شروع', stop: 'توقف',
  connect: 'اتصال', connected: 'متصل', disconnect: 'قطع اتصال', disconnected: 'قطع‌شده', test: 'آزمون', manage: 'مدیریت', import: 'واردکردن', export: 'صادرکردن',
  official: 'رسمی', personal: 'شخصی', custom: 'دلخواه', template: 'قالب', preview: 'پیش‌نمایش', generated: 'تولیدشده',
  integrate: 'یکپارچه‌سازی', external: 'خارجی', services: 'سرویس‌ها', tools: 'ابزارها', activate: 'فعال کنید', templates: 'قالب‌ها', extend: 'گسترش دهید', agents: 'عامل‌ها',
  frequency: 'تناوب', toggle: 'روشن یا خاموش کردن', trace: 'رهگیری', tracing: 'رهگیری', paused: 'متوقف‌شده', expression: 'عبارت', creator: 'ایجادکننده', actions: 'اقدام‌ها', action: 'اقدام',
  confirm: 'تأیید', security: 'امنیت', credentials: 'اعتبارنامه‌ها', change: 'تغییر', unchanged: 'بدون تغییر', leave: 'رها کنید', blank: 'خالی', displayed: 'نمایش داده می‌شود', purpose: 'هدف',
  communication: 'ارتباطات', project: 'پروژه', development: 'توسعه', category: 'دسته‌بندی', reactivation: 'فعال‌سازی دوباره',
  run: 'اجرا', previous: 'قبلی', minute: 'دقیقه', hour: 'ساعت', day: 'روز', week: 'هفته', month: 'ماه', weekday: 'روزهای هفته',
  need: 'نیاز دارد', needs: 'نیازمند', attention: 'توجه', shown: 'نمایش‌داده‌شده', load: 'بارگذاری', operation: 'عملیات',
  original: 'اصلی', raw: 'خام', environment: 'محیط', read: 'خواندن', reuse: 'استفادهٔ مجدد', will: 'خواهد',
};

const persianize = (value: string): string => {
  // Interpolation names are API contracts, not translatable prose. Keep every
  // i18next/Python-style token intact while applying the fallback word map.
  const placeholders: string[] = [];
  let result = value.replace(/\{\{[\s\S]*?\}\}|\{[A-Za-z_][A-Za-z0-9_.]*\}|\$\{[^}]+\}/g, token => {
    const index = placeholders.push(token) - 1;
    return `__DBGPT_PLACEHOLDER_${index}__`;
  });
  // Replace longer phrases first, while preserving interpolation placeholders,
  // URLs, file extensions, model names and technical identifiers.
  for (const [source, target] of phraseMap) result = result.split(source).join(target);
  for (const [source, target] of Object.entries(wordMap)) {
    result = result.replace(new RegExp(`\\b${source}\\b`, 'gi'), target);
  }
  return result.replace(/__DBGPT_PLACEHOLDER_(\d+)__/g, (_, index) => placeholders[Number(index)]);
};

const autoCommon = Object.fromEntries(Object.entries(CommonEn).map(([key, value]) => [key, persianize(value)]));
const autoChat = Object.fromEntries(Object.entries(ChatEn).map(([key, value]) => [key, persianize(value)]));
const autoFlow = Object.fromEntries(Object.entries(FlowEn).map(([key, value]) => [key, persianize(value)]));
const autoObservability = Object.fromEntries(Object.entries(ObservabilityEn).map(([key, value]) => [key, persianize(value)]));

const fa = {
  ...en,
  ...autoCommon,
  ...autoChat,
  ...autoFlow,
  ...autoObservability,
  ...ChatFa,
  ...CommonFa,
  ...FlowFa,
  ...ObservabilityFa,
  Chinese: 'چینی',
  English: 'انگلیسی',
  Persian: 'فارسی',
};

export default fa;
