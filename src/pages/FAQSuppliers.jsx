import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import FaqAccordion from '../components/FaqAccordion';

const CONTENT = {
  ar: {
    eyebrow: 'مَعبر · أسئلة المورد',
    title: 'كل ما يحتاجه المورد لفهم الدخول والعمل داخل معبر',
    intro: 'هذه الصفحة توضّح أهم أسئلة الموردين: التسجيل، التحقق، متى تظهر الطلبات، كيف تُرفع العروض، وكيف تسير المدفوعات داخل المنصة.',
    backLabel: 'العودة إلى صفحة الأسئلة الرئيسية',
    sideCard: {
      eyebrow: 'روابط سريعة',
      title: 'راجع المسار الكامل من جهة التاجر أو الشروط',
      text: 'يمكنك فتح أسئلة التاجر لفهم توقعات الطرف الآخر، أو مراجعة الشروط والأحكام لمعرفة الإطار القانوني العام داخل المنصة.',
      actions: [
        { label: 'الشروط والأحكام', path: '/terms' },
        { label: 'أسئلة التاجر', path: '/faq/traders', variant: 'ghost' },
      ],
    },
    items: [
      { q: 'ما هي مَعبر؟', a: 'مَعبر منصة B2B تربط التجار السعوديين بالموردين الصينيين عبر مسار أكثر وضوحاً وثقة. دور المورد داخل المنصة هو استقبال الطلبات المناسبة، تقديم عروض واضحة، وإكمال الصفقة وفق الشروط المتفق عليها.' },
      { q: 'كيف أنضم إلى معبر كمورد؟', a: 'تبدأ من بوابة الموردين، ثم تنشئ حسابك وتكمل بياناتك الأساسية ومعلومات الشركة والمستندات المطلوبة. بعد ذلك يدخل الحساب في مسار المراجعة قبل التفعيل الكامل.' },
      { q: 'هل أحتاج إلى تحقق قبل أن أبدأ؟', a: 'نعم. معبر يعتمد الموردين قبل فتح الوصول الكامل للمنصة. التحقق جزء أساسي من بناء الثقة مع التجار، لذلك لا يتم التعامل مع الحساب كمورد فعّال قبل اجتياز المراجعة.' },
      { q: 'ماذا يحدث بعد التسجيل؟', a: 'بعد التسجيل وتأكيد البيانات، ينتقل الحساب إلى مرحلة المراجعة. خلال هذه المرحلة قد يُطلب استكمال معلومات أو مستندات إضافية قبل اعتماد الحساب نهائياً.' },
      { q: 'هل أستطيع رفع منتجاتي مباشرة؟', a: 'هذا يعتمد على حالة الحساب. إذا كان الحساب لا يزال تحت المراجعة أو لم يكتمل التحقق، فقد تبقى بعض الإمكانات مقيّدة إلى أن تتم الموافقة. الوصول التشغيلي الكامل يكون بعد التوثيق.' },
      { q: 'متى أرى طلبات التجار؟', a: 'تظهر الطلبات للمورد بعد أن يصبح الحساب في حالة تسمح بالوصول التشغيلي. الهدف هو أن تصل الطلبات فقط إلى الموردين الذين اجتازوا مراحل الاعتماد المطلوبة.' },
      { q: 'كيف أرسل عرض سعر؟', a: 'عند توفر طلب مناسب، يقدّم المورد عرضه من خلال المنصة مع السعر، الكمية الدنيا، مدة التسليم، وأي ملاحظات لازمة. كلما كان العرض أوضح وأكثر دقة، زادت قابلية المقارنة والثقة.' },
      { q: 'كيف أتواصل مع التاجر؟', a: 'عندما يبدأ تفاعل فعلي على طلب أو عرض، يتم التواصل ضمن تدفق المنصة حتى تبقى المحادثة مرتبطة بالطلب والعرض ويمكن الرجوع لها عند الحاجة.' },
      { q: 'كيف يستلم المورد المدفوعات؟', a: 'المدفوعات تسير بحسب هيكل الصفقة المعتمد داخل معبر. قد تكون الصفقة بدفعات مرحلية، وتُصرف المدفوعات وفق المراحل المتفق عليها بدلاً من طلب تحويلات خارج المنصة.' },
      { q: 'هل توجد عمولات على المورد؟', a: 'التسجيل مجاني، ومعبر تأخذ 0% عمولة على الصفقة.' },
      { q: 'هل الشحن على المورد؟', a: 'مسؤولية الشحن تعتمد على ما يتم الاتفاق عليه في العرض المختار. لذلك يجب أن تكون تفاصيل الشحن والتسليم واضحة داخل العرض قبل اعتماد الصفقة.' },
      { q: 'ماذا يحدث أثناء فترة المراجعة؟', a: 'أثناء المراجعة قد يكون الحساب محدوداً في بعض الوظائف التشغيلية. يبقى المطلوب عادة استكمال أي نواقص، متابعة حالة الطلب، والانتظار حتى موافقة الفريق على التفعيل.' },
      { q: 'هل تتدخل معبر في النزاعات؟', a: 'نعم. إذا حصل خلاف موثّق حول التنفيذ أو الشحن أو مطابقة الطلب، تتدخل معبر كطرف محايد وتراجع الأدلة من الطرفين وفق الشروط المعتمدة.' },
      { q: 'ماذا يعني “مورد موثّق”؟', a: 'يعني أن المورد اجتاز مسار التحقق والمراجعة المطلوب داخل معبر وأصبح حسابه معتمداً لاستقبال الطلبات والعمل داخل المنصة بحالة تشغيلية كاملة.' },
    ],
  },
  en: {
    eyebrow: 'Maabar · Supplier FAQ',
    title: 'What suppliers need to understand before working on Maabar',
    intro: 'This page explains the supplier-side flow clearly: registration, verification, when requests appear, how quotes are submitted, and how payouts move inside the platform.',
    backLabel: 'Back to main FAQ',
    sideCard: {
      eyebrow: 'Quick links',
      title: 'See the trader-side flow or the legal framework',
      text: 'Open the trader FAQ to understand what the other side expects, or review the terms page for the broader legal structure of the platform.',
      actions: [
        { label: 'Terms & Conditions', path: '/terms' },
        { label: 'Trader FAQ', path: '/faq/traders', variant: 'ghost' },
      ],
    },
    items: [
      { q: 'What is Maabar?', a: 'Maabar is a B2B platform that connects Saudi traders with Chinese suppliers through a clearer and more trusted sourcing flow. The supplier role on the platform is to receive relevant requests, submit clear offers, and complete transactions according to the agreed terms.' },
      { q: 'How do I join Maabar as a supplier?', a: 'You start from the supplier portal, create your account, and complete your company details, business information, and requested documents. After that, the account moves into review before full activation.' },
      { q: 'Do I need verification before I start?', a: 'Yes. Maabar verifies suppliers before giving full access to the platform. Verification is part of how trust is built with traders, so the account is not treated as fully active until review is completed.' },
      { q: 'What happens after registration?', a: 'After registration and data confirmation, the account enters the review stage. During this period, the team may request additional information or documents before final approval.' },
      { q: 'Can I upload products immediately?', a: 'That depends on the account state. If the account is still under review or verification is incomplete, some operational capabilities may remain restricted until approval. Full working access follows verification.' },
      { q: 'When do I see trader requests?', a: 'Requests become available once the supplier account reaches a state that allows operational access. The goal is for buyer requests to be visible only to suppliers who have passed the required onboarding and review stages.' },
      { q: 'How do I submit a quote?', a: 'When a relevant request is available, the supplier submits an offer through the platform with price, minimum quantity, delivery time, and any necessary notes. Clear and accurate offers improve trust and make comparison easier for traders.' },
      { q: 'How do I communicate with the trader?', a: 'When real engagement begins on a request or offer, communication happens within the platform flow so the conversation stays tied to the transaction context and can be referenced later if needed.' },
      { q: 'How do suppliers get paid?', a: 'Payouts follow the transaction structure agreed inside Maabar. Deals may involve staged payments, and funds move according to those milestones instead of relying on off-platform transfer requests.' },
      { q: 'Are there commissions for suppliers?', a: 'Registration is free, and Maabar charges 0% commission on the transaction.' },
      { q: 'Is shipping on the supplier?', a: 'Shipping responsibility depends on the selected offer and what is agreed inside it. For that reason, shipping and delivery terms should always be stated clearly before the transaction is confirmed.' },
      { q: 'What happens while I am under review?', a: 'During review, the account may have limited access to certain operational features. The practical next step is to complete any missing information, monitor application status, and wait for final approval.' },
      { q: 'Does Maabar intervene in disputes?', a: 'Yes. If there is a documented dispute related to execution, shipping, or match to specification, Maabar can step in as a neutral party and review evidence from both sides under the governing terms.' },
      { q: 'What does “verified supplier” mean?', a: 'It means the supplier has completed Maabar’s required verification and review flow and now has an approved account that can operate on the platform with full working access.' },
    ],
  },
  zh: {
    eyebrow: 'Maabar · 供应商 FAQ',
    title: '供应商在 Maabar 开始工作前需要了解的内容',
    intro: '本页清楚说明供应商侧流程：注册、认证、何时看到贸易商需求、如何提交报价，以及收款如何在平台内进行。',
    backLabel: '返回主 FAQ',
    sideCard: {
      eyebrow: '快捷入口',
      title: '查看贸易商侧流程或法律框架',
      text: '您可以打开贸易商 FAQ 了解对方的预期，也可以查看条款页面了解平台的整体法律结构。',
      actions: [
        { label: '条款与条件', path: '/terms' },
        { label: '贸易商 FAQ', path: '/faq/traders', variant: 'ghost' },
      ],
    },
    items: [
      { q: 'Maabar 是什么？', a: 'Maabar 是一个 B2B 平台，通过更清晰、更值得信赖的采购流程连接沙特贸易商与中国供应商。供应商在平台中的角色，是接收相关需求、提交清晰报价，并按约定条款完成交易。' },
      { q: '我如何作为供应商加入 Maabar？', a: '您需要从供应商入口开始，创建账户并完善公司资料、业务信息以及所需文件。之后账户会进入审核流程，审核通过后才会完全激活。' },
      { q: '开始前必须完成认证吗？', a: '是的。Maabar 会先审核供应商，再开放完整平台权限。认证是建立贸易商信任的重要部分，因此账户在审核完成前不会被视为完全激活。' },
      { q: '注册后会发生什么？', a: '注册并确认资料后，账户会进入审核阶段。在此期间，团队可能会要求补充更多信息或文件，然后才会给出最终批准。' },
      { q: '我可以马上上传产品吗？', a: '这取决于账户状态。如果账户仍在审核中，或认证尚未完成，部分运营功能可能仍会受到限制。完整使用权限通常在认证通过后开放。' },
      { q: '我什么时候能看到贸易商需求？', a: '当供应商账户进入允许运营访问的状态后，相关需求才会显示。这样做是为了确保贸易商需求只开放给通过必要审核阶段的供应商。' },
      { q: '我如何提交报价？', a: '当有合适需求出现时，供应商可以通过平台提交报价，包括价格、最小起订量、交期以及必要说明。报价越清晰准确，贸易商越容易比较并建立信任。' },
      { q: '我如何与贸易商沟通？', a: '当需求或报价进入实际互动后，沟通会在平台流程内进行，这样对话会和交易上下文绑定，后续也便于查阅。' },
      { q: '供应商如何收款？', a: '收款按照 Maabar 内部约定的交易结构执行。交易可能采用分阶段付款，资金会根据这些里程碑流转，而不是依赖平台外的收款要求。' },
      { q: '供应商是否要支付佣金？', a: '注册免费，Maabar 对交易收取 0% 佣金。' },
      { q: '运输由供应商负责吗？', a: '运输责任取决于所选报价中的具体约定。因此，在交易确认前，应当把运输与交付条款写清楚。' },
      { q: '审核期间会发生什么？', a: '在审核期间，账户可能无法使用部分运营功能。实际需要做的是补齐缺失资料、查看申请状态，并等待最终批准。' },
      { q: '发生争议时 Maabar 会介入吗？', a: '会。如果出现与履约、运输或规格匹配有关且有记录可核实的争议，Maabar 可以作为中立方根据平台条款审查双方证据。' },
      { q: '“认证供应商”是什么意思？', a: '这表示供应商已经完成 Maabar 要求的认证与审核流程，账户已获批准，可以在平台上以完整运营状态开展业务。' },
    ],
  },
};

export default function FAQSuppliers({ lang }) {
  const content = CONTENT[lang] || CONTENT.ar;

  usePageTitle('faq', lang);

  return (
    <>
      <FaqAccordion lang={lang} {...content} />
      <Footer lang={lang} />
    </>
  );
}
