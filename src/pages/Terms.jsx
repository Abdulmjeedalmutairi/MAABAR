import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';

const CR_NUMBER = '7042243308';
const CONTACT_EMAIL = 'info@maabar.io';
const WEBSITE_URL = 'https://maabar.io';
const LAST_UPDATED_ISO = '2026-04-01';

const SECTIONS = {
  ar: [
    { title: '١. تعريف المنصة', body: 'مَعبر هي منصة وساطة تجارية إلكترونية تربط التجار السعوديين بالموردين الصينيين. تعمل مَعبر بوصفها وسيطاً تجارياً فقط، وليست طرفاً في أي صفقة تُبرم بين المستخدمين. مسؤولية التحقق من المنتجات وجودتها وشروط التسليم تقع على عاتق الطرفين المتعاقدَين.' },
    { title: '٢. شروط التسجيل', body: 'للتاجر: يجب أن يكون مقيماً أو يمارس نشاطاً تجارياً في المملكة العربية السعودية، وأن يُقر بصحة بياناته.\n\nللمورد: يجب أن يكون لديه سجل تجاري ساري، ويخضع لمراجعة وموافقة مَعبر قبل تفعيل حسابه. قد يستغرق الاعتماد 3-5 أيام عمل.\n\nيحق لمَعبر تعليق أي حساب أو إلغاؤه في حال ثبت انتهاك هذه الشروط.' },
    { title: '٣. آلية إبرام العقود', body: 'تُبرم الصفقات عبر آلية العرض والقبول: يرفع التاجر طلباً، يُقدّم الموردون عروضهم، يختار التاجر العرض الأنسب ويؤكده. يُعدّ هذا التأكيد عقداً ملزماً بين الطرفين. تحتفظ مَعبر بسجل رقمي لكل عقد مبرم لمدة ٣ سنوات.' },
    { title: '٤. نظام الدفع المرحلي', body: 'تتيح مَعبر ثلاثة خيارات للدفع:\n• ٣٠٪ مقدماً (الأكثر أماناً): يدفع التاجر ٣٠٪ لبدء التجهيز، والباقي ٧٠٪ قبل الشحن.\n• ٥٠٪ مقدماً (متوازن): يدفع التاجر ٥٠٪، والباقي قبل الشحن مع أولوية في التجهيز.\n• ١٠٠٪ مقدماً (أسرع شحن): دفعة واحدة كاملة، والمورد يشحن فوراً.\n\nالدفعة الأولى تُمثّل التزام التاجر وتُمكّن المورد من بدء الإنتاج. الدفعة الثانية تُسدَّد بعد إشعار «الشحنة جاهزة» من المورد.' },
    { title: '٥. العمولة', body: 'تأخذ مَعبر 0% عمولة على الصفقة.' },
    { title: '٦. حقوق وواجبات التاجر', body: 'الحقوق: الاطلاع على عروض الموردين المعتمدين، المطالبة بالاسترداد في حالات التقصير الثابتة، تقييم الموردين بعد اكتمال الصفقة.\n\nالواجبات: تقديم معلومات دقيقة في الطلبات، الالتزام بالدفع بعد قبول العرض، الإبلاغ عن أي مشكلة خلال ٧ أيام من الاستلام.' },
    { title: '٧. حقوق وواجبات المورد', body: 'الحقوق: استلام المدفوعات وفق الجدول المتفق عليه، الرد على الشكاوى وتقديم توثيق كافٍ.\n\nالواجبات: الالتزام بمواصفات المنتج والتسليم في المدة المتفق عليها، إشعار التاجر بأي تأخير، وعدم طلب مدفوعات خارج منصة مَعبر.' },
    { title: '٨. سياسة المشاكل والإرجاع', body: '١. إذا وصلت البضاعة تالفة أو مختلفة عن الوصف: للتاجر ٧ أيام من تاريخ الاستلام لرفع شكوى، مع إرفاق صور أو فيديو يوثّق المشكلة، وتراجع مَعبر الشكوى خلال ٣ أيام عمل.\n\n٢. إذا لم يشحن المورد بعد استلام الدفعة الثانية: يحق للتاجر رفع شكوى فورية، وتتدخل مَعبر وتوقف حساب المورد مؤقتاً، وتُرجع الدفعة الثانية للتاجر.\n\n٣. الدفعة الأولى (٣٠٪ أو ٥٠٪): غير قابلة للاسترداد إذا بدأ المورد التجهيز فعلاً، وقابلة للاسترداد إذا ثبت التقصير من المورد.\n\n٤. قرار مَعبر في النزاعات نهائي وملزم للطرفين.' },
    { title: '٩. تسوية النزاعات', body: 'تلتزم مَعبر بالبت في النزاعات خلال ٧ أيام عمل من استلام الشكوى المكتملة. تعمل مَعبر كطرف محايد وتستند إلى الأدلة المقدمة من الطرفين. قرار مَعبر نهائي وملزم.' },
    { title: '١٠. الخصوصية وحماية البيانات', body: '١. المقدمة\nتلتزم مَعبر بحماية خصوصية مستخدميها وفق أحكام نظام حماية البيانات الشخصية السعودي (PDPL) ولوائحه التنفيذية. توضح هذه السياسة ما نجمعه من بيانات، وكيف نستخدمها، وما هي حقوقك كمستخدم.\nباستخدامك لمنصة مَعبر، فإنك توافق على الشروط الواردة في هذه السياسة.\n\n٢. البيانات التي نجمعها\nعند التسجيل والاستخدام:\n▪ الاسم الكامل وبيانات التواصل (البريد الإلكتروني، رقم الهاتف).\n▪ بيانات السجل التجاري للموردين.\n▪ تفاصيل الصفقات والعروض والمحادثات داخل المنصة.\n▪ بيانات الاستخدام التقني (عنوان IP، نوع المتصفح، سجلات الدخول).\nما لا نجمعه:\n▪ بيانات البطاقات البنكية أو معلومات الدفع — تُعالَج مباشرةً عبر بوابة ميسر المرخصة ولا تمر عبر خوادمنا.\n\n٣. كيف نستخدم بياناتك\n▪ تشغيل المنصة وإتمام الصفقات بين التجار والموردين.\n▪ التحقق من هوية المستخدمين وضمان أمن الحسابات.\n▪ إشعارك بتحديثات الصفقات والرسائل والتنبيهات.\n▪ تحسين خدمات المنصة وتطويرها.\n▪ الامتثال للمتطلبات النظامية والقانونية في المملكة العربية السعودية.\n\n٤. مشاركة البيانات مع أطراف ثالثة\nلا نبيع بياناتك ولا نشاركها مع أي طرف ثالث إلا في الحالات التالية:\n▪ بوابة الدفع ميسر — لمعالجة المدفوعات فقط.\n▪ مزودو الخدمات التقنية المعتمدون لتشغيل البنية التحتية للمنصة — بموجب اتفاقيات سرية صارمة.\n▪ الجهات الحكومية والقضائية — عند صدور أمر قانوني ملزم.\nفي جميع الحالات، تُشارَك البيانات بالحد الأدنى الضروري فقط.\n\n٥. تخزين البيانات وحمايتها\n▪ تُخزَّن بياناتك على خوادم سحابية مؤمّنة بسياسات تحكم صارمة وفق أعلى معايير الأمن.\n▪ جميع البيانات المتبادلة مشفّرة عبر بروتوكول SSL.\n▪ نحتفظ ببيانات الصفقات لمدة ٣ سنوات من تاريخ إتمام الصفقة أو إنهائها.\n▪ بعد انتهاء مدة الاحتفاظ، تُحذف البيانات بشكل آمن.\n\n٦. حقوقك كمستخدم\nوفق نظام PDPL، يحق لك في أي وقت:\n▪ الاطلاع على بياناتك الشخصية المحفوظة لدينا.\n▪ طلب تصحيح أي بيانات غير دقيقة.\n▪ طلب حذف بياناتك بعد انتهاء العلاقة التعاقدية، مع الاحتفاظ بما يلزم قانونياً.\n▪ الاعتراض على معالجة بياناتك لأغراض التسويق.\nلممارسة أي من هذه الحقوق: support@maabar.io\n\n٧. ملفات تعريف الارتباط (Cookies)\nتستخدم مَعبر ملفات Cookies ضرورية لتشغيل المنصة وتسجيل الدخول. لا نستخدم Cookies لأغراض إعلانية أو تتبع خارجي.\n\n٨. الاختراق الأمني\nفي حال وقوع اختراق أمني يمس بياناتك الشخصية، تلتزم مَعبر بإشعارك خلال ٧٢ ساعة من اكتشاف الاختراق، وفق متطلبات الهيئة الوطنية للأمن السيبراني.\nللإبلاغ عن أي ثغرة أمنية: support@maabar.io\n\n٩. تعديل السياسة\nتحتفظ مَعبر بحق تعديل هذه السياسة في أي وقت. يُشعَر المستخدمون المسجّلون بأي تعديل جوهري قبل ٣٠ يوماً من تاريخ سريانه عبر البريد الإلكتروني.\n\n١٠. التواصل\nلأي استفسار يتعلق بهذه السياسة:\n▪ البريد الإلكتروني: support@maabar.io' },
    { title: '١١. الأمن السيبراني', body: 'في حال وقوع اختراق أمني يمس بيانات المستخدمين، تلتزم مَعبر بإشعار المتضررين خلال ٣ أيام عمل من اكتشاف الاختراق، وفق متطلبات الهيئة الوطنية للأمن السيبراني.' },
    { title: '١٢. التعديلات على الشروط', body: 'تحتفظ مَعبر بحق تعديل هذه الشروط في أي وقت. يُشترط إشعار المستخدمين المسجّلين بأي تعديل جوهري قبل أسبوع على الأقل من تاريخ سريانه. استمرار استخدام المنصة بعد التعديل يُعدّ قبولاً ضمنياً.' },
    { title: '١٣. الاختصاص القضائي', body: 'تخضع هذه الشروط لأنظمة المملكة العربية السعودية. في حال نشوء نزاع لم يُسوَّ وفق آلية مَعبر، يختص القضاء السعودي بالنظر فيه.' },
    { title: '١٤. حفظ العقود والبيانات', body: 'تحتفظ مَعبر بسجلات العقود والمحادثات والمدفوعات لمدة ٣ سنوات من تاريخ إتمام الصفقة أو إنهائها.' },
  ],
  en: [
    { title: '1. Platform Definition', body: 'Maabar is an electronic trade intermediary platform connecting Saudi traders with Chinese suppliers. Maabar acts only as an intermediary and is not a party to any transaction concluded between users. Responsibility for verifying products, quality, and delivery terms remains with the contracting parties.' },
    { title: '2. Registration Terms', body: 'For traders: the user must be resident in, or operating a business in, Saudi Arabia and must confirm that submitted data is accurate.\n\nFor suppliers: the user must hold a valid commercial registration or business license and is subject to Maabar review and approval before account activation. Approval may take 3-5 business days.\n\nMaabar may suspend or terminate any account that violates these terms.' },
    { title: '3. Contract Formation', body: 'Transactions are formed through an offer-and-acceptance model: the trader posts a request, suppliers submit offers, and the trader confirms the selected offer. That confirmation constitutes a binding agreement between the two parties. Maabar retains a digital record of each concluded contract for 3 years.' },
    { title: '4. Staged Payment System', body: 'Maabar offers three payment options:\n• 30% upfront: the trader pays 30% to begin preparation, and the remaining 70% before shipping.\n• 50% upfront: the trader pays 50%, and the remaining balance before shipping with priority preparation.\n• 100% upfront: full payment in one installment, after which the supplier proceeds directly.\n\nThe first installment represents the trader’s commitment and enables the supplier to begin production. The second installment is paid after a “Shipment Ready” notification from the supplier.' },
    { title: '5. Commission', body: 'Maabar charges 0% commission on the transaction.' },
    { title: '6. Trader Rights and Obligations', body: 'Rights: access approved supplier offers, request refunds in proven cases of supplier default, and rate suppliers after the transaction is completed.\n\nObligations: provide accurate request information, honor payment after accepting an offer, and report any problem within 7 days of receipt.' },
    { title: '7. Supplier Rights and Obligations', body: 'Rights: receive payments according to the agreed schedule, respond to complaints, and provide sufficient documentation.\n\nObligations: deliver products matching the agreed specifications within the agreed timeframe, notify the trader of any delay, and avoid requesting payment outside Maabar.' },
    { title: '8. Issues and Returns Policy', body: '1. If goods arrive damaged or materially different from the description, the trader has 7 days from receipt to file a complaint with supporting photos or video, and Maabar reviews the complaint within 3 business days.\n\n2. If the supplier fails to ship after receiving the second installment, the trader may file an immediate complaint, Maabar may intervene and temporarily suspend the supplier account, and the second installment may be returned to the trader.\n\n3. The first installment (30% or 50%) is not refundable if the supplier has genuinely started preparation, but it may be refundable if supplier default is proven.\n\n4. Maabar’s decision in disputes is final and binding on both parties.' },
    { title: '9. Dispute Resolution', body: 'Maabar undertakes to review and resolve disputes within 7 business days of receiving a complete complaint. Maabar acts as a neutral party and relies on the evidence submitted by both sides. Its decision is final and binding.' },
    { title: '10. Privacy and Data Protection', body: '1. Introduction\nMaabar is committed to protecting the privacy of its users in accordance with the provisions of the Saudi Personal Data Protection Law (PDPL) and its executive regulations. This policy explains what data we collect, how we use it, and what your rights are as a user.\nBy using the Maabar platform, you agree to the terms set out in this policy.\n\n2. Data We Collect\nDuring registration and use:\n▪ Full name and contact details (email, phone number).\n▪ Commercial registration data for suppliers.\n▪ Details of transactions, offers, and conversations within the platform.\n▪ Technical usage data (IP address, browser type, login logs).\nWhat we do not collect:\n▪ Bank card data or payment information — processed directly through the licensed Maysir gateway and does not pass through our servers.\n\n3. How We Use Your Data\n▪ Operating the platform and completing transactions between traders and suppliers.\n▪ Verifying user identity and securing accounts.\n▪ Notifying you of transaction updates, messages, and alerts.\n▪ Improving and developing the platform\'s services.\n▪ Compliance with regulatory and legal requirements in the Kingdom of Saudi Arabia.\n\n4. Sharing Data with Third Parties\nWe do not sell your data nor share it with any third party except in the following cases:\n▪ Maysir payment gateway — for payment processing only.\n▪ Approved technical service providers for operating the platform\'s infrastructure — under strict confidentiality agreements.\n▪ Government and judicial authorities — when a legally binding order is issued.\nIn all cases, data is shared only to the minimum extent necessary.\n\n5. Data Storage and Protection\n▪ Your data is stored on secure cloud servers with strict control policies adhering to the highest security standards.\n▪ All exchanged data is encrypted via SSL protocol.\n▪ We retain transaction data for 3 years from the date the transaction is completed or terminated.\n▪ After the retention period ends, data is securely deleted.\n\n6. Your Rights as a User\nUnder the PDPL, you have the right at any time to:\n▪ Access your personal data held by us.\n▪ Request correction of any inaccurate data.\n▪ Request deletion of your data after the contractual relationship ends, subject to legal retention requirements.\n▪ Object to the processing of your data for marketing purposes.\nTo exercise any of these rights: support@maabar.io\n\n7. Cookies\nMaabar uses essential cookies to operate the platform and enable login. We do not use cookies for advertising or external tracking.\n\n8. Security Breach\nIn the event of a security breach affecting your personal data, Maabar undertakes to notify you within 72 hours of detecting the breach, in accordance with the requirements of the National Cybersecurity Authority.\nTo report any security vulnerability: support@maabar.io\n\n9. Policy Amendments\nMaabar reserves the right to amend this policy at any time. Registered users will be notified of any material amendment 30 days before it takes effect via email.\n\n10. Contact\nFor any inquiries regarding this policy:\n▪ Email: support@maabar.io' },
    { title: '11. Cybersecurity', body: 'If a security incident affects user data, Maabar undertakes to notify affected users within 3 business days from discovery of the incident, in line with applicable Saudi cybersecurity requirements.' },
    { title: '12. Amendments', body: 'Maabar reserves the right to amend these terms at any time. Registered users must be notified of any material change at least one week before it takes effect. Continued use of the platform after the change constitutes implied acceptance.' },
    { title: '13. Governing Law and Jurisdiction', body: 'These terms are governed by the laws of the Kingdom of Saudi Arabia. If a dispute is not resolved through Maabar’s mechanism, the Saudi courts shall have jurisdiction.' },
    { title: '14. Record Retention', body: 'Maabar retains records of contracts, communications, and payments for 3 years from the date a transaction is completed or terminated.' },
  ],
  zh: [
    { title: '1. 平台定义', body: 'Maabar 是一个电子贸易中介平台，连接沙特贸易商与中国供应商。Maabar 仅作为中介存在，并非用户之间交易的合同方。产品核验、质量判断以及交付条款的确认责任由交易双方自行承担。' },
    { title: '2. 注册条款', body: '贸易商：用户须在沙特阿拉伯居住或经营业务，并确认所提交资料真实准确。\n\n供应商：用户须持有有效商业登记或营业执照，并在账户激活前接受 Maabar 审核与批准。审核通常需要 3-5 个工作日。\n\n如账户违反本条款，Maabar 可暂停或终止该账户。' },
    { title: '3. 合同成立方式', body: '交易通过“报价—接受”的方式成立：贸易商发布需求，供应商提交报价，贸易商确认所选报价。该确认构成双方之间具有约束力的协议。Maabar 会保留每份已成立合同的数字记录 3 年。' },
    { title: '4. 分阶段付款制度', body: 'Maabar 提供三种付款方式：\n• 30% 预付款：贸易商支付 30% 启动准备，剩余 70% 于发货前支付。\n• 50% 预付款：贸易商支付 50%，余额于发货前支付，并享有优先准备。\n• 100% 一次性付款：全额支付后由供应商直接推进发货。\n\n首付款代表贸易商的交易承诺，并使供应商能够开始生产。第二笔款项在供应商发出“货物就绪”通知后支付。' },
    { title: '5. 平台佣金', body: 'Maabar 对交易收取 0% 佣金。' },
    { title: '6. 贸易商的权利与义务', body: '权利：查看已批准供应商的报价、在供应商违约得到证实时申请退款、在交易完成后评价供应商。\n\n义务：在需求中提供准确信息、接受报价后履行付款义务，并在收货后 7 天内报告问题。' },
    { title: '7. 供应商的权利与义务', body: '权利：按照约定时间表收款、回应投诉并提供充分证明材料。\n\n义务：在约定时间内交付符合规格的产品、如有延迟及时通知贸易商，并不得要求平台外付款。' },
    { title: '8. 问题与退货政策', body: '1. 如货物损坏或与描述存在重大差异，贸易商可在收货后 7 天内提交投诉，并附上照片或视频作为证明，Maabar 将在 3 个工作日内审查。\n\n2. 如供应商在收到第二笔款项后仍未发货，贸易商可立即投诉，Maabar 可介入并暂时暂停该供应商账户，第二笔款项可退还给贸易商。\n\n3. 首付款（30% 或 50%）如供应商已实际开始准备，则通常不予退还；如已证明供应商违约，则可能予以退还。\n\n4. Maabar 在争议中的决定为最终决定，并对双方具有约束力。' },
    { title: '9. 争议解决', body: 'Maabar 承诺在收到完整投诉后的 7 个工作日内完成争议审查与处理。Maabar 作为中立方，根据双方提交的证据作出决定，该决定为最终且具有约束力。' },
    { title: '10. 隐私与数据保护', body: '1. 引言\nMaabar 致力于根据沙特个人数据保护法（PDPL）及其执行条例保护用户的隐私。本政策说明我们收集哪些数据、如何使用这些数据以及您作为用户的权利。\n使用 Maabar 平台即表示您同意本政策中的条款。\n\n2. 我们收集的数据\n在注册和使用过程中：\n▪ 全名和联系方式（电子邮件、电话号码）。\n▪ 供应商的商业注册数据。\n▪ 平台内的交易、报价和对话详情。\n▪ 技术使用数据（IP 地址、浏览器类型、登录日志）。\n我们不收集：\n▪ 银行卡数据或支付信息 — 通过持牌的 Maysir 网关直接处理，不经过我们的服务器。\n\n3. 我们如何使用您的数据\n▪ 运营平台并完成贸易商与供应商之间的交易。\n▪ 验证用户身份并保障账户安全。\n▪ 通知您交易更新、消息和提醒。\n▪ 改进和开发平台服务。\n▪ 遵守沙特阿拉伯王国的法规和法律要求。\n\n4. 与第三方共享数据\n我们不出售您的数据，也不会与任何第三方共享数据，除非在以下情况：\n▪ Maysir 支付网关 — 仅用于支付处理。\n▪ 经批准的技术服务提供商，用于运营平台基础设施 — 根据严格的保密协议。\n▪ 政府和司法机构 — 当收到具有法律约束力的命令时。\n在所有情况下，数据仅以最低必要程度共享。\n\n5. 数据存储和保护\n▪ 您的数据存储在安全的云服务器上，采用严格的控制策略，符合最高安全标准。\n▪ 所有交换的数据均通过 SSL 协议加密。\n▪ 我们将交易数据保留 3 年，自交易完成或终止之日起计算。\n▪ 保留期结束后，数据将被安全删除。\n\n6. 您作为用户的权利\n根据 PDPL，您有权随时：\n▪ 访问我们持有的您的个人数据。\n▪ 要求更正任何不准确的数据。\n▪ 在合同关系结束后要求删除您的数据，但须遵守法律保留要求。\n▪ 反对为营销目的处理您的数据。\n行使任何上述权利：support@maabar.io\n\n7. Cookie\nMaabar 使用必要的 Cookie 来运营平台并实现登录功能。我们不将 Cookie 用于广告或外部跟踪。\n\n8. 安全漏洞\n如果发生影响您个人数据的安全漏洞，Maabar 承诺在检测到漏洞后 72 小时内通知您，并符合国家网络安全局的要求。\n报告任何安全漏洞：support@maabar.io\n\n9. 政策修改\nMaabar 保留随时修改本政策的权利。注册用户将在任何重大修改生效前 30 天通过电子邮件收到通知。\n\n10. 联系\n有关本政策的任何咨询：\n▪ 电子邮件：support@maabar.io' },
    { title: '11. 网络安全', body: '如发生影响用户数据的安全事件，Maabar 承诺自发现之日起 3 个工作日内通知受影响用户，并遵守适用的沙特网络安全要求。' },
    { title: '12. 条款修改', body: 'Maabar 保留随时修改本条款的权利。若变更属于重大修改，注册用户应至少在生效前一周收到通知。用户在修改生效后继续使用平台，即视为默示接受。' },
    { title: '13. 适用法律与管辖', body: '本条款受沙特阿拉伯王国法律管辖。若争议无法通过 Maabar 的机制解决，则由沙特法院管辖。' },
    { title: '14. 记录保存', body: 'Maabar 会自交易完成或终止之日起，保存合同、沟通记录及付款记录 3 年。' },
  ],
};

const T = {
  ar: {
    eyebrow: 'مَعبر · الشروط والأحكام',
    title: 'الشروط والأحكام',
    intro: 'تم إعداد هذه الصفحة بصياغة عربية مرجعية، مع إبقائها جاهزة لبنية متعددة اللغات داخل الموقع. باستخدام مَعبر فإنك توافق على هذه الشروط والأحكام.',
    referenceNote: 'النسخة العربية هي المرجع الأساسي لهذه الصفحة في الوقت الحالي.',
    updatedLabel: 'آخر تحديث',
    companyLabel: 'السجل التجاري',
    emailLabel: 'البريد الإلكتروني',
    websiteLabel: 'الموقع الإلكتروني',
  },
  en: {
    eyebrow: 'Maabar · Terms & Conditions',
    title: 'Terms & Conditions',
    intro: 'This page is structured for multilingual support while keeping the Arabic legal wording as the primary reference source for now. By using Maabar, you agree to these terms and conditions.',
    referenceNote: 'For now, the Arabic version remains the primary reference of this page.',
    updatedLabel: 'Last updated',
    companyLabel: 'CR Number',
    emailLabel: 'Email',
    websiteLabel: 'Website',
  },
  zh: {
    eyebrow: 'Maabar · 条款与条件',
    title: '条款与条件',
    intro: '此页面已按多语言结构准备，但目前仍以阿拉伯语法律文本作为主要参考来源。使用 Maabar 即表示您同意这些条款与条件。',
    referenceNote: '当前页面仍以阿拉伯语版本作为主要参考。',
    updatedLabel: '最后更新',
    companyLabel: '商业登记号',
    emailLabel: '邮箱',
    websiteLabel: '网站',
  },
};

function formatLastUpdated(lang) {
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${LAST_UPDATED_ISO}T00:00:00`));
}

export default function Terms({ lang }) {
  const isAr = lang === 'ar';
  const t = T[lang] || T.ar;
  const sections = SECTIONS[lang] || SECTIONS.ar;
  const metaItems = [
    { label: t.updatedLabel, value: formatLastUpdated(lang) },
    { label: t.companyLabel, value: CR_NUMBER },
    { label: t.emailLabel, value: CONTACT_EMAIL },
    { label: t.websiteLabel, value: WEBSITE_URL },
  ];

  usePageTitle('terms', lang);

  return (
    <div style={{ minHeight: 'var(--app-dvh)', paddingTop: 'var(--page-top-offset)', background: 'var(--bg-base)' }}>
      <section className="terms-hero" style={{ padding: '80px 60px 40px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <p style={{ margin: '0 0 18px', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            {t.eyebrow}
          </p>
          <h1 style={{ margin: '0 0 18px', fontSize: isAr ? 50 : 58, lineHeight: 1.08, fontWeight: 300, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)' }}>
            {t.title}
          </h1>
          <p style={{ margin: '0 0 16px', maxWidth: 760, fontSize: 15, lineHeight: 1.9, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {t.intro}
          </p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {t.referenceNote}
          </p>
        </div>
      </section>

      <section className="terms-meta-wrap" style={{ padding: '32px 60px 24px' }}>
        <div className="terms-meta-grid" style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          {metaItems.map((item) => (
            <div key={item.label} style={{ border: '1px solid var(--border-subtle)', borderRadius: 22, background: 'var(--bg-raised)', padding: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
                {item.label}
              </p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', wordBreak: 'break-word', fontFamily: item.label === t.websiteLabel || item.label === t.emailLabel ? 'var(--font-sans)' : (isAr ? 'var(--font-ar)' : 'var(--font-sans)') }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="terms-body" style={{ padding: '0 60px 80px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {sections.map((section) => (
            <article key={section.title} style={{ border: '1px solid var(--border-subtle)', borderRadius: 24, background: 'var(--bg-base)', padding: '24px 24px 22px' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: isAr ? 24 : 22, lineHeight: 1.4, fontWeight: 400, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {section.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 2, color: 'var(--text-secondary)', whiteSpace: 'pre-line', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Footer lang={lang} />

      <style>{`
        @media (max-width: 900px) {
          .terms-meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 768px) {
          .terms-hero,
          .terms-meta-wrap,
          .terms-body {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }

          .terms-meta-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
