import Footer from '../components/Footer';
import React, { useState } from 'react';

const SECTIONS_AR = [
  {
    title: '١. تعريف المنصة',
    body: `مَعبر هي منصة وساطة تجارية إلكترونية تربط التجار السعوديين بالموردين الصينيين. تعمل مَعبر بوصفها وسيطاً تجارياً فقط، وليست طرفاً في أي صفقة تُبرم بين المستخدمين. مسؤولية التحقق من المنتجات وجودتها وشروط التسليم تقع على عاتق الطرفين المتعاقدَين.`,
  },
  {
    title: '٢. شروط التسجيل',
    body: `للتاجر: يجب أن يكون مقيماً أو يمارس نشاطاً تجارياً في المملكة العربية السعودية، وأن يُقر بصحة بياناته.
للمورد: يجب أن يكون لديه سجل تجاري ساري، ويخضع لمراجعة وموافقة مَعبر قبل تفعيل حسابه. قد يستغرق الاعتماد 3-5 أيام عمل.
يحق لمَعبر تعليق أي حساب أو إلغاؤه في حال ثبت انتهاك هذه الشروط.`,
  },
  {
    title: '٣. آلية إبرام العقود',
    body: `تُبرم الصفقات عبر آلية العرض والقبول: يرفع التاجر طلبًا، يُقدّم الموردون عروضهم، يختار التاجر العرض الأنسب ويؤكده. يُعدّ هذا التأكيد عقدًا ملزمًا بين الطرفين. تحتفظ مَعبر بسجل رقمي لكل عقد مبرم لمدة ٣ سنوات.`,
  },
  {
    title: '٤. نظام الدفع المرحلي',
    body: `تتيح مَعبر ثلاثة خيارات للدفع:
• ٣٠٪ مقدماً (الأكثر أماناً): يدفع التاجر ٣٠٪ لبدء التجهيز، والباقي (٧٠٪) قبل الشحن.
• ٥٠٪ مقدماً (متوازن): يدفع التاجر ٥٠٪، والباقي قبل الشحن مع أولوية في التجهيز.
• ١٠٠٪ مقدماً (أسرع شحن): دفعة واحدة كاملة، والمورد يشحن فوراً.
الدفعة الأولى تُمثّل التزام التاجر وتُمكّن المورد من بدء الإنتاج. الدفعة الثانية تُسدَّد بعد إشعار "الشحنة جاهزة" من المورد.`,
  },
  {
    title: '٥. العمولة',
    body: `تأخذ مَعبر عمولة إجمالية ٦٪ من قيمة كل صفقة مكتملة: ٤٪ من المورد، و٢٪ من التاجر. تُخصم العمولة تلقائياً عند إتمام الدفع.`,
  },
  {
    title: '٦. حقوق وواجبات التاجر',
    body: `الحقوق: الاطلاع على عروض الموردين المعتمدين، المطالبة بالاسترداد في حالات التقصير الثابتة، تقييم الموردين بعد اكتمال الصفقة.
الواجبات: تقديم معلومات دقيقة في الطلبات، الالتزام بالدفع بعد قبول العرض، الإبلاغ عن أي مشكلة خلال ٧ أيام من الاستلام.`,
  },
  {
    title: '٧. حقوق وواجبات المورد',
    body: `الحقوق: استلام المدفوعات وفق الجدول المتفق عليه، الرد على الشكاوى وتقديم توثيق كافٍ.
الواجبات: الالتزام بمواصفات المنتج والتسليم في المدة المتفق عليها، إشعار التاجر بأي تأخير، عدم طلب مدفوعات خارج منصة مَعبر.`,
  },
  {
    title: '٨. سياسة المشاكل والإرجاع',
    body: `١. إذا وصلت البضاعة تالفة أو مختلفة عن الوصف:
   — للتاجر ٧ أيام من تاريخ الاستلام لرفع شكوى.
   — يرفق صوراً أو فيديو يوثّق المشكلة.
   — مَعبر تراجع الشكوى خلال ٣ أيام عمل.

٢. إذا لم يشحن المورد بعد استلام الدفعة الثانية:
   — التاجر يرفع شكوى فورية.
   — مَعبر تتدخل وتوقف حساب المورد مؤقتاً.
   — تُرجع الدفعة الثانية للتاجر.

٣. الدفعة الأولى (٣٠٪ أو ٥٠٪):
   — غير قابلة للاسترداد إذا بدأ المورد التجهيز فعلاً.
   — قابلة للاسترداد إذا ثبت التقصير من المورد.

٤. قرار مَعبر في النزاعات نهائي وملزم للطرفين.`,
  },
  {
    title: '٩. تسوية النزاعات',
    body: `تلتزم مَعبر بالبت في النزاعات خلال ٧ أيام عمل من استلام الشكوى المكتملة. تعمل مَعبر كطرف محايد وتستند إلى الأدلة المقدمة من الطرفين. قرار مَعبر نهائي وملزم.`,
  },
  {
    title: '١٠. الخصوصية وحماية البيانات',
    body: `تلتزم مَعبر بنظام حماية البيانات الشخصية السعودي (PDPL). نجمع البيانات الضرورية فقط لتشغيل المنصة ولا نبيعها لأي طرف ثالث. يحق لكل مستخدم طلب الاطلاع على بياناته أو تصحيحها أو حذفها.`,
  },
  {
    title: '١١. الأمن السيبراني',
    body: `في حال وقوع اختراق أمني يمس بيانات المستخدمين، تلتزم مَعبر بإشعار المتضررين خلال ٣ أيام عمل من اكتشاف الاختراق، وفق متطلبات الهيئة الوطنية للأمن السيبراني.`,
  },
  {
    title: '١٢. التعديلات على الشروط',
    body: `تحتفظ مَعبر بحق تعديل هذه الشروط في أي وقت. يُشترط إشعار المستخدمين المسجّلين بأي تعديل جوهري قبل أسبوع على الأقل من تاريخ سريانه. استمرار استخدام المنصة بعد التعديل يُعدّ قبولاً ضمنياً.`,
  },
  {
    title: '١٣. الاختصاص القضائي',
    body: `تخضع هذه الشروط لأنظمة المملكة العربية السعودية. في حال نشوء نزاع لم يُسوَّ وفق آلية مَعبر، يختص القضاء السعودي بالنظر فيه.`,
  },
  {
    title: '١٤. حفظ العقود والبيانات',
    body: `تحتفظ مَعبر بسجلات العقود والمحادثات والمدفوعات لمدة ٣ سنوات من تاريخ إتمام الصفقة أو إنهائها.`,
  },
];

const SECTIONS_EN = [
  {
    title: '1. Platform Definition',
    body: `Maabar is an electronic trade intermediary platform connecting Saudi traders with Chinese suppliers. Maabar acts solely as a broker and is not a party to any transaction. Both parties bear responsibility for verifying product quality, specifications, and delivery terms.`,
  },
  {
    title: '2. Registration Terms',
    body: `For Buyers: Must be resident or operating a business in Saudi Arabia, and certify accuracy of their data.
For Suppliers: Must hold a valid business license and undergo Maabar review before account activation (3-5 business days). Maabar may suspend or terminate any account for policy violations.`,
  },
  {
    title: '3. Contract Mechanism',
    body: `Transactions follow an offer-acceptance model: Buyer posts a request → Suppliers submit offers → Buyer selects and confirms an offer. Confirmation constitutes a binding contract. Maabar retains digital records of all contracts for 3 years.`,
  },
  {
    title: '4. Installment Payment System',
    body: `Maabar offers three payment options:
• 30% upfront (Safest): Buyer pays 30% to start production; remaining 70% before shipping.
• 50% upfront (Balanced): Buyer pays 50%; remainder before shipping with priority preparation.
• 100% upfront (Fastest): Full payment; supplier ships immediately.
The first installment represents the buyer's commitment and enables the supplier to begin production. The second installment is paid after the supplier issues a "Shipment Ready" notification.`,
  },
  {
    title: '5. Commission',
    body: `Maabar charges a 6% total commission on each completed transaction: 4% from the supplier and 2% from the buyer. Commission is automatically deducted at payment.`,
  },
  {
    title: '6. Buyer Rights & Obligations',
    body: `Rights: Access verified supplier offers, claim refunds for proven supplier defaults, rate suppliers after deal completion.
Obligations: Provide accurate information in requests, honor payment after accepting an offer, report any issues within 7 days of receipt.`,
  },
  {
    title: '7. Supplier Rights & Obligations',
    body: `Rights: Receive payments on the agreed schedule, respond to complaints with sufficient documentation.
Obligations: Deliver products matching specifications within the agreed timeframe, notify buyer of any delays, never request payment outside Maabar.`,
  },
  {
    title: '8. Issues & Returns Policy',
    body: `1. If goods arrive damaged or different from the description:
   — Buyer has 7 days from receipt to raise a complaint.
   — Must attach photos or video documenting the issue.
   — Maabar reviews within 3 business days.

2. If supplier fails to ship after receiving the second installment:
   — Buyer may file an immediate complaint.
   — Maabar intervenes and temporarily suspends the supplier account.
   — Second installment is refunded to the buyer.

3. First installment (30% or 50%):
   — Non-refundable if supplier has genuinely begun production.
   — Refundable if supplier default is proven.

4. Maabar's decision in disputes is final and binding on both parties.`,
  },
  {
    title: '9. Dispute Resolution',
    body: `Maabar commits to resolving disputes within 7 business days of receiving a complete complaint. Maabar acts as a neutral party based on evidence from both sides. Its decision is final and binding.`,
  },
  {
    title: '10. Privacy & Data Protection',
    body: `Maabar complies with Saudi Arabia's Personal Data Protection Law (PDPL). We collect only necessary data to operate the platform and do not sell it to third parties. Users may request access, correction, or deletion of their data.`,
  },
  {
    title: '11. Cybersecurity',
    body: `In the event of a security breach affecting user data, Maabar will notify affected users within 3 business days of discovery, in accordance with the National Cybersecurity Authority requirements.`,
  },
  {
    title: '12. Amendments',
    body: `Maabar reserves the right to modify these terms. Registered users must be notified of material changes at least one week before they take effect. Continued use of the platform constitutes implicit acceptance.`,
  },
  {
    title: '13. Jurisdiction',
    body: `These terms are governed by Saudi Arabian law. Unresolved disputes fall under the jurisdiction of Saudi courts.`,
  },
  {
    title: '14. Record Retention',
    body: `Maabar retains records of contracts, communications, and payments for 3 years from the date of transaction completion or termination.`,
  },
];

const SECTIONS_ZH = [
  { title: '1. 平台定义', body: 'Maabar是连接沙特贸易商与中国供应商的电子贸易中介平台。Maabar仅作为经纪人，不参与任何交易。双方均有责任核实产品质量、规格和交货条款。' },
  { title: '2. 注册条款', body: '采购商：必须在沙特阿拉伯居住或经营，并确认数据准确性。供应商：必须持有有效营业执照，经Maabar审核后激活账户（3-5个工作日）。违规可能导致账户暂停或终止。' },
  { title: '3. 合同机制', body: '交易遵循要约-承诺模式：买家发布需求 → 供应商提交报价 → 买家选择并确认报价。确认构成具有约束力的合同。Maabar保留所有合同的数字记录3年。' },
  { title: '4. 分期付款系统', body: 'Maabar提供三种付款选项：30%预付（最安全）、50%预付（均衡）、100%预付（最快发货）。首付款使供应商开始生产，尾款在供应商发出"货物就绪"通知后支付。' },
  { title: '5. 佣金', body: 'Maabar对每笔完成的交易收取6%总佣金：4%来自供应商，2%来自买家。佣金在付款时自动扣除。' },
  { title: '6. 买家权利与义务', body: '权利：获取认证供应商报价、在供应商违约时申请退款、完成交易后评价供应商。义务：在需求中提供准确信息、接受报价后履行付款义务、在收货后7天内报告任何问题。' },
  { title: '7. 供应商权利与义务', body: '权利：按约定时间表收款、提供充分文件回应投诉。义务：按规格交付产品并在约定时间内完成、通知买家任何延误、不得在Maabar之外要求付款。' },
  { title: '8. 问题与退货政策', body: '1. 如货物损坏或与描述不符：买家有7天投诉期，需附照片或视频，Maabar在3个工作日内审查。2. 如供应商收到尾款后未发货：买家可立即投诉，Maabar介入并暂停供应商账户，尾款退还买家。3. 首付款：如供应商已开始生产则不退，如供应商违约则可退。4. Maabar在争议中的决定为终局且对双方有约束力。' },
  { title: '9. 争议解决', body: 'Maabar承诺在收到完整投诉后7个工作日内解决争议。Maabar作为中立方，基于双方提供的证据做出决定，该决定为终局且有约束力。' },
  { title: '10. 隐私与数据保护', body: 'Maabar遵守沙特阿拉伯个人数据保护法（PDPL）。我们仅收集运营平台所需的数据，不向第三方出售。用户可请求访问、更正或删除其数据。' },
  { title: '11. 网络安全', body: '如发生影响用户数据的安全漏洞，Maabar将在发现后3个工作日内通知受影响用户，符合国家网络安全局要求。' },
  { title: '12. 修订', body: 'Maabar保留修改这些条款的权利。重大变更必须至少提前一周通知注册用户。继续使用平台即视为默示接受。' },
  { title: '13. 司法管辖', body: '这些条款受沙特阿拉伯法律管辖。未解决的争议由沙特法院管辖。' },
  { title: '14. 记录保留', body: 'Maabar保留合同、通信和付款记录3年，自交易完成或终止之日起计算。' },
];

export default function Terms({ lang }) {
  const isAr = lang === 'ar';
  const isZh = lang === 'zh';
  const [activeSection, setActiveSection] = useState(null);

  const sections = isAr ? SECTIONS_AR : isZh ? SECTIONS_ZH : SECTIONS_EN;

  return (
    <div className="about-wrap">
      <div className="about-hero">
        <h1 className={`about-title${isAr ? ' ar' : ''}`}>
          {isAr ? 'الشروط والأحكام' : isZh ? '条款与条件' : 'Terms & Conditions'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-disabled)', marginTop: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isAr ? 'آخر تحديث: مارس 2026' : isZh ? '最后更新：2026年3月' : 'Last updated: March 2026'}
        </p>
      </div>

      <div className="about-body">
        {sections.map((sec, i) => (
          <div key={i} style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '20px 0',
          }}>
            <button
              onClick={() => setActiveSection(activeSection === i ? null : i)}
              style={{
                width: '100%', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: isAr ? 'right' : 'left',
                padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 12,
              }}>
              <h2 style={{
                fontSize: isAr ? 17 : 16, fontWeight: 500,
                color: 'var(--text-primary)', margin: 0,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {sec.title}
              </h2>
              <span style={{ color: 'var(--text-disabled)', fontSize: 14, flexShrink: 0 }}>
                {activeSection === i ? '−' : '+'}
              </span>
            </button>

            {activeSection === i && (
              <p style={{
                fontSize: isAr ? 14 : 13, lineHeight: 2, color: 'var(--text-secondary)',
                marginTop: 16, whiteSpace: 'pre-line',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {sec.body}
              </p>
            )}
          </div>
        ))}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
