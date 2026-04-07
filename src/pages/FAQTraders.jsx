import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import FaqAccordion from '../components/FaqAccordion';

const CONTENT = {
  ar: {
    eyebrow: 'مَعبر · أسئلة التاجر',
    title: 'كل ما يحتاجه التاجر قبل أن يبدأ الصفقة',
    intro: 'هذه الصفحة تجمع أهم الأسئلة العملية للتاجر داخل معبر: كيف يرفع الطلب، كيف يقارن العروض، كيف يعمل الدفع، ومتى تتدخل المنصة.',
    backLabel: 'العودة إلى صفحة الأسئلة الرئيسية',
    sideCard: {
      eyebrow: 'روابط سريعة',
      title: 'هل تريد مراجعة الشروط أو أسئلة الموردين؟',
      text: 'إذا كنت تريد الصورة الكاملة، راجع الشروط والأحكام أو افتح صفحة الموردين لفهم ما يراه الطرف الآخر داخل المنصة.',
      actions: [
        { label: 'الشروط والأحكام', path: '/terms' },
        { label: 'أسئلة المورد', path: '/faq/suppliers', variant: 'ghost' },
      ],
    },
    items: [
      { q: 'ما هي مَعبر؟', a: 'مَعبر منصة B2B تربط التجار السعوديين بالموردين الصينيين مباشرة داخل مسار أوضح وأكثر أماناً. بدلاً من البحث اليدوي بين عشرات الجهات، يرفع التاجر طلبه وتصل العروض من الموردين المناسبين عبر المنصة.' },
      { q: 'كيف يعمل معبر للتاجر؟', a: 'يرفع التاجر طلبه مع تفاصيل المنتج أو التصنيع والكمية. بعد ذلك يستقبل عروضاً من موردين معتمدين، يقارن بينها، يختار العرض المناسب، ثم يكمل الصفقة والدفع والمتابعة من خلال معبر.' },
      { q: 'هل الموردون موثّقون؟', a: 'نعم. الموردون الذين يظهرون ويستقبلون الطلبات داخل معبر يمرّون بمراجعة وتحقق قبل تفعيل حساباتهم. وجود المورد داخل المنصة لا يلغي أهمية مراجعة العرض نفسه، لكنه يضيف طبقة ثقة قبل بدء التعامل.' },
      { q: 'كيف أتواصل مع المورد؟', a: 'بعد وجود تفاعل فعلي على الطلب أو العرض، يتم التواصل من خلال أدوات المنصة بحيث تبقى المحادثة والسياق أوضح للطرفين ويمكن الرجوع لها عند الحاجة.' },
      { q: 'هل أحتاج أن أعرف الصينية؟', a: 'لا. معبر مصمم لتقليل حاجز اللغة بين التاجر السعودي والمورد الصيني، لذلك يمكن إدارة التواصل بشكل أوضح بدون أن تكون اللغة الصينية شرطاً لبدء الصفقة.' },
      { q: 'كيف يعمل الدفع؟', a: 'معبر يقدّم مسار دفع محمياً ومرناً بحسب نوع الاتفاق. يمكن أن تكون الصفقة بدفعات مرحلية، ويجري التعامل مع المدفوعات داخل إطار المنصة بدلاً من تحويلات عشوائية خارجها.' },
      { q: 'هل توجد دفعات مرحلية؟', a: 'نعم. الشروط الحالية تذكر خيارات دفع مثل 30٪ مقدماً أو 50٪ مقدماً أو 100٪ مقدماً بحسب ما يتم الاتفاق عليه. الهدف هو منح التاجر مرونة أكبر مع وضوح في متى تبدأ التجهيزات ومتى تُستكمل الدفعات.' },
      { q: 'متى يتم إطلاق الدفعة النهائية؟', a: 'بحسب آلية الصفقة المتفق عليها، تُستكمل الدفعة النهائية بعد وصول الصفقة إلى المرحلة المحددة داخل العملية — مثل إشعار الجاهزية أو استكمال الشروط المتفق عليها. راجع تفاصيل الصفقة والشروط دائماً قبل التأكيد.' },
      { q: 'من المسؤول عن الشحن؟', a: 'الشحن يعتمد على ما يتم الاتفاق عليه في العرض بين التاجر والمورد. معبر يسهّل الصفقة والوضوح، لكن مسؤوليات الشحن نفسها يجب أن تكون محددة بوضوح في العرض أو الاتفاق قبل الدفع.' },
      { q: 'هل أستطيع مقارنة أكثر من عرض؟', a: 'نعم. هذا من أصل الفكرة في معبر. التاجر يرفع طلباً واحداً ثم يراجع عروضاً قابلة للمقارنة من موردين مناسبين بدلاً من التفاوض بشكل منفصل مع كل جهة من الصفر.' },
      { q: 'هل توجد رسوم أو عمولات؟', a: 'التسجيل في المنصة مجاني، ومعبر تأخذ 0% عمولة على الصفقة.' },
      { q: 'هل أستطيع طلب علامة خاصة أو تصنيع مخصص؟', a: 'نعم. معبر مناسب أيضاً لطلبات الـ private label والتصنيع حسب الطلب، ويمكنك توضيح ذلك مباشرة داخل الطلب حتى يستقبل الموردون المناسبون هذه المتطلبات من البداية.' },
      { q: 'هل يمكنني إلغاء الصفقة؟', a: 'الإلغاء يعتمد على مرحلة الصفقة وما إذا كان المورد بدأ التنفيذ أو التصنيع. بعض الدفعات قد لا تكون قابلة للاسترداد إذا ثبت أن العمل بدأ فعلاً. لذلك يجب مراجعة العرض والشروط قبل التأكيد النهائي.' },
      { q: 'هل تتدخل معبر في النزاعات؟', a: 'نعم. إذا وُجد خلاف موثّق أو مشكلة في التنفيذ، تعمل معبر كطرف محايد يراجع الأدلة المقدمة من الطرفين ويتدخل وفق الشروط المعتمدة داخل المنصة.' },
    ],
  },
  en: {
    eyebrow: 'Maabar · Trader FAQ',
    title: 'What traders usually need before moving forward',
    intro: 'This page covers the practical questions traders ask most: how requests work, how offers are compared, how payments are structured, and where Maabar steps in.',
    backLabel: 'Back to main FAQ',
    sideCard: {
      eyebrow: 'Quick links',
      title: 'Need the legal page or supplier-side answers too?',
      text: 'Open the terms page for the legal framework, or view the supplier FAQ to understand the flow from the other side of the marketplace.',
      actions: [
        { label: 'Terms & Conditions', path: '/terms' },
        { label: 'Supplier FAQ', path: '/faq/suppliers', variant: 'ghost' },
      ],
    },
    items: [
      { q: 'What is Maabar?', a: 'Maabar is a B2B platform that connects Saudi traders with Chinese suppliers through a clearer and safer sourcing flow. Instead of searching manually across many channels, the trader posts one request and receives relevant supplier offers through the platform.' },
      { q: 'How does Maabar work for traders?', a: 'The trader submits a request with product or manufacturing details and quantity. Relevant suppliers send offers, the trader compares them, chooses the right one, and then continues the deal, payment, and follow-up through Maabar.' },
      { q: 'Are suppliers verified?', a: 'Yes. Suppliers who receive requests on Maabar go through a review and verification process before their accounts are activated. That does not remove the need to review each offer carefully, but it adds an important trust layer before the deal starts.' },
      { q: 'How do I communicate with a supplier?', a: 'Once there is active engagement on a request or offer, communication happens through the platform flow so the conversation remains clearer for both sides and can be referenced later if needed.' },
      { q: 'Do I need to know Chinese?', a: 'No. Maabar is built to reduce the language barrier between Saudi traders and Chinese suppliers, so traders can move deals forward more confidently without needing Chinese as a prerequisite.' },
      { q: 'How does payment work?', a: 'Maabar supports a protected and flexible payment flow based on the type of agreement. Payments can be staged, and the process is intended to stay inside the platform framework instead of relying on random off-platform transfers.' },
      { q: 'Are staged payments available?', a: 'Yes. The current terms mention options such as 30% upfront, 50% upfront, or 100% upfront depending on the agreed structure. The goal is to give traders more control over commitment and timing.' },
      { q: 'When is the final payment released?', a: 'The final installment depends on the agreed deal structure and milestone. In practice, it is completed when the transaction reaches the agreed stage, such as shipment readiness or another confirmed step defined in the offer.' },
      { q: 'Who handles shipping?', a: 'Shipping responsibility depends on the agreement inside the selected offer. Maabar helps structure the flow clearly, but shipping ownership and terms should always be defined in the deal before payment.' },
      { q: 'Can I compare multiple offers?', a: 'Yes. That is one of the core benefits of Maabar. You post one request and compare relevant offers side by side instead of starting separate sourcing conversations from scratch with each supplier.' },
      { q: 'Are there any fees?', a: 'Registration is free, and Maabar charges 0% commission on the transaction.' },
      { q: 'Can I request private label or custom manufacturing?', a: 'Yes. Maabar is also suitable for private label and custom manufacturing requests. You can state those requirements clearly in the request so the right suppliers respond with relevant offers.' },
      { q: 'Can I cancel?', a: 'Cancellation depends on the transaction stage and whether production or preparation has already started. Some installments may not be refundable if the supplier has already begun work, so the offer and terms should be reviewed carefully before confirmation.' },
      { q: 'Does Maabar intervene in disputes?', a: 'Yes. If a documented issue or disagreement happens, Maabar acts as a neutral party, reviews the evidence from both sides, and intervenes according to the terms governing the platform.' },
    ],
  },
  zh: {
    eyebrow: 'Maabar · 贸易商 FAQ',
    title: '贸易商在推进交易前最常问的问题',
    intro: '这里汇总了贸易商最常见的实际问题：需求如何发布、报价如何比较、付款如何安排，以及 Maabar 会在什么情况下介入。',
    backLabel: '返回主 FAQ',
    sideCard: {
      eyebrow: '快捷入口',
      title: '还想看法律页面或供应商侧说明？',
      text: '您可以打开条款页面查看法律框架，也可以查看供应商 FAQ，了解平台另一侧的流程。',
      actions: [
        { label: '条款与条件', path: '/terms' },
        { label: '供应商 FAQ', path: '/faq/suppliers', variant: 'ghost' },
      ],
    },
    items: [
      { q: 'Maabar 是什么？', a: 'Maabar 是一个 B2B 平台，通过更清晰、更安全的采购流程连接沙特贸易商与中国供应商。贸易商无需在多个渠道中手动寻找，只需发布一次需求，即可通过平台收到相关报价。' },
      { q: '贸易商如何使用 Maabar？', a: '贸易商提交产品或定制生产需求与数量，相关供应商发送报价，贸易商进行比较、选择合适方案，然后继续通过 Maabar 完成后续交易、付款与跟进。' },
      { q: '供应商是否经过认证？', a: '是的。能够在 Maabar 接收需求的供应商，在账户激活前都会经过审核与认证。这并不意味着无需审查具体报价，但能在交易开始前增加一层重要的信任保障。' },
      { q: '我如何与供应商沟通？', a: '当需求或报价进入实际互动后，沟通会在平台流程中进行，这样双方都能获得更清晰的上下文，也便于后续回看。' },
      { q: '我需要会中文吗？', a: '不需要。Maabar 的设计目标之一就是降低沙特贸易商与中国供应商之间的语言障碍，让用户无需掌握中文也能更安心地推进交易。' },
      { q: '付款是如何运作的？', a: 'Maabar 提供受保护且灵活的付款流程，具体取决于交易结构。付款可以分阶段进行，整体流程应尽量留在平台框架内，而不是依赖平台外的随意转账。' },
      { q: '是否支持分阶段付款？', a: '支持。当前条款提到可以根据协议选择 30% 预付、50% 预付或 100% 预付等方式，目的是让贸易商对承诺程度和付款时点有更清晰的控制。' },
      { q: '尾款什么时候支付？', a: '尾款取决于双方约定的交易结构与里程碑。通常会在交易达到约定阶段后完成，例如货物准备就绪，或报价中定义的其他确认节点。' },
      { q: '谁负责运输？', a: '运输责任取决于所选报价中的约定。Maabar 会帮助把交易流程理清，但运输责任与条款应在付款前于交易中明确。' },
      { q: '我可以比较多个报价吗？', a: '可以。这正是 Maabar 的核心价值之一。您发布一次需求后，可以并排比较相关报价，而不是和每个供应商从零开始分别沟通。' },
      { q: '是否有费用？', a: '注册免费，Maabar 对交易收取 0% 佣金。' },
      { q: '我可以要求自有品牌或定制生产吗？', a: '可以。Maabar 也适用于自有品牌和定制生产需求。您可以在需求中直接写明这些要求，以便合适的供应商从一开始就按此回复。' },
      { q: '我可以取消吗？', a: '是否可以取消取决于交易所处阶段，以及供应商是否已经开始生产或准备。一旦工作已经开始，部分款项可能无法退还，因此在最终确认前应仔细审阅报价和条款。' },
      { q: '发生争议时 Maabar 会介入吗？', a: '会。如果出现有记录可核实的问题或分歧，Maabar 会作为中立方审查双方证据，并根据平台条款进行介入。' },
    ],
  },
};

export default function FAQTraders({ lang }) {
  const content = CONTENT[lang] || CONTENT.ar;

  usePageTitle('faq', lang);

  return (
    <>
      <FaqAccordion lang={lang} {...content} />
      <Footer lang={lang} />
    </>
  );
}
