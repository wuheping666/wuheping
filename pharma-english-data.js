/* ============================================================
 * 药企英语词库 (PharmaLex Word Bank)
 * 面向制药企业从业者的英语学习数据
 * 字段: word 单词 / pos 词性 / phonetic 音标(可空) /
 *       cn 中文释义 / en 英文例句 / cn 例句中文
 * ============================================================ */
const PHARMA_BANKS = [
  {
    id: "regulatory",
    name: "法规与注册",
    enName: "Regulatory & Filing",
    icon: "⚖️",
    desc: "药品注册、申报与 GxP 体系核心术语",
    words: [
      { word: "NDA", pos: "n.", phonetic: "/ˌen diː ˈeɪ/", cn: "新药申请（New Drug Application）", en: "The company submitted an NDA for the new oncology drug.", cn: "该公司提交了这款新抗肿瘤药的新药申请。" },
      { word: "IND", pos: "n.", phonetic: "/ˌaɪ en ˈdiː/", cn: "新药临床试验申请（Investigational New Drug）", en: "An IND must be filed before starting human trials.", cn: "开展人体试验前必须提交 IND。" },
      { word: "ANDA", pos: "n.", phonetic: "/ˈæn də/", cn: "简化新药申请／仿制药申请", en: "The ANDA was approved six months after submission.", cn: "该 ANDA 在提交六个月后获得批准。" },
      { word: "BLA", pos: "n.", phonetic: "/ˌbiː el ˈeɪ/", cn: "生物制品许可申请（Biologics License Application）", en: "A BLA is required to market a therapeutic biologic.", cn: "上市治疗性生物制品需要提交 BLA。" },
      { word: "MAH", pos: "n.", phonetic: "/em eɪtʃ/", cn: "药品上市许可持有人（Marketing Authorization Holder）", en: "The MAH is responsible for the全生命周期 quality of the drug.", cn: "上市许可持有人对药品全生命周期质量负责。" },
      { word: "GMP", pos: "n.", phonetic: "/dʒiː em piː/", cn: "药品生产质量管理规范", en: "The plant was inspected for GMP compliance.", cn: "该工厂接受了 GMP 符合性检查。" },
      { word: "GCP", pos: "n.", phonetic: "/dʒiː siː piː/", cn: "药物临床试验质量管理规范", en: "All trials must be conducted in accordance with GCP.", cn: "所有试验必须依照 GCP 开展。" },
      { word: "GLP", pos: "n.", phonetic: "/dʒiː el piː/", cn: "药物非临床研究质量管理规范", en: "Toxicology studies follow GLP standards.", cn: "毒理学研究遵循 GLP 标准。" },
      { word: "ICH", pos: "n.", phonetic: "/aɪ siː eɪtʃ/", cn: "国际人用药品注册技术协调会", en: "ICH guidelines harmonize global drug regulations.", cn: "ICH 指导原则协调全球药品法规。" },
      { word: "DMF", pos: "n.", phonetic: "/diː em ef/", cn: "药物主文件（Drug Master File）", en: "The API supplier lodged a DMF with the agency.", cn: "原料药供应商向监管机构递交了 DMF。" },
      { word: "CMC", pos: "n.", phonetic: "/siː em siː/", cn: "化学、制造与控制（Chemistry, Manufacturing & Controls）", en: "CMC data support the manufacturing process.", cn: "CMC 数据支撑生产工艺。" },
      { word: "CTD", pos: "n.", phonetic: "/siː tiː diː/", cn: "通用技术文件（Common Technical Document）", en: "The dossier was organized in CTD format.", cn: "申报资料按 CTD 格式整理。" },
      { word: "dossier", pos: "n.", phonetic: "/ˈdɒsieɪ/", cn: "申报资料／档案", en: "We compiled the registration dossier last quarter.", cn: "我们在上季度汇编了注册申报资料。" },
      { word: "submission", pos: "n.", phonetic: "/səbˈmɪʃn/", cn: "提交／申报", en: "The electronic submission was validated successfully.", cn: "电子申报已成功通过校验。" },
      { word: "marketing authorization", pos: "n.", phonetic: "/ˈmɑːkɪtɪŋ ɔːθəraɪˈzeɪʃn/", cn: "上市许可", en: "They obtained marketing authorization in the EU.", cn: "他们在欧盟获得了上市许可。" }
    ]
  },
  {
    id: "clinical",
    name: "临床医学",
    enName: "Clinical Development",
    icon: "🩺",
    desc: "临床试验设计与实施关键词汇",
    words: [
      { word: "protocol", pos: "n.", phonetic: "/ˈprəʊtəkɒl/", cn: "试验方案", en: "The study protocol was approved by the ethic committee.", cn: "研究方案已获伦理委员会批准。" },
      { word: "endpoint", pos: "n.", phonetic: "/ˈendpɔɪnt/", cn: "终点指标（疗效评价终点）", en: "Overall survival was the primary endpoint.", cn: "总生存期为首要终点指标。" },
      { word: "cohort", pos: "n.", phonetic: "/ˈkəʊhɔːt/", cn: "队列", en: "A cohort of 200 patients was enrolled.", cn: "入组了一个 200 人的队列。" },
      { word: "placebo", pos: "n.", phonetic: "/pləˈsiːbəʊ/", cn: "安慰剂", en: "The control arm received placebo.", cn: "对照组接受安慰剂。" },
      { word: "randomization", pos: "n.", phonetic: "/ˌrændəmaɪˈzeɪʃn/", cn: "随机化", en: "Randomization minimized selection bias.", cn: "随机化降低了选择偏倚。" },
      { word: "double-blind", pos: "adj.", phonetic: "/ˌdʌbl ˈblaɪnd/", cn: "双盲的", en: "The trial was double-blind and placebo-controlled.", cn: "该试验为双盲、安慰剂对照设计。" },
      { word: "adverse event", pos: "n.", phonetic: "/ədˈvɜːs ɪˈvent/", cn: "不良事件（AE）", en: "All adverse events were recorded in the eCRF.", cn: "所有不良事件均记录在电子病例报告表中。" },
      { word: "ADR", pos: "n.", phonetic: "/eɪ diː ˈɑː/", cn: "药物不良反应（Adverse Drug Reaction）", en: "The ADR was reported to the authorities within 24h.", cn: "该 ADR 已在 24 小时内上报监管机构。" },
      { word: "pharmacokinetics", pos: "n.", phonetic: "/ˌfɑːməkəʊkɪˈnetɪks/", cn: "药代动力学（PK）", en: "PK characterized the absorption and clearance.", cn: "药代动力学描述了吸收与清除特征。" },
      { word: "pharmacodynamics", pos: "n.", phonetic: "/ˌfɑːməkəʊdaɪˈnæmɪks/", cn: "药效动力学（PD）", en: "PD explained the dose-response relationship.", cn: "药效动力学解释了量效关系。" },
      { word: "efficacy", pos: "n.", phonetic: "/ˈefɪkəsi/", cn: "疗效", en: "The drug demonstrated superior efficacy.", cn: "该药显示出更优的疗效。" },
      { word: "titration", pos: "n.", phonetic: "/taɪˈtreɪʃn/", cn: "滴定／剂量调整", en: "Dose titration was based on tolerance.", cn: "剂量滴定基于耐受性进行。" },
      { word: "inclusion criteria", pos: "n.", phonetic: "/ɪnˈkluːʒn kraɪˈtɪəriə/", cn: "入选标准", en: "Inclusion criteria required confirmed diagnosis.", cn: "入选标准要求确诊。" },
      { word: "informed consent", pos: "n.", phonetic: "/ɪnˈfɔːmd kənˈsent/", cn: "知情同意", en: "Each subject signed an informed consent form.", cn: "每位受试者均签署了知情同意书。" },
      { word: "recruitment", pos: "n.", phonetic: "/rɪˈkruːtmənt/", cn: "受试者招募", en: "Site recruitment lagged behind plan.", cn: "中心招募进度落后于计划。" }
    ]
  },
  {
    id: "chemistry",
    name: "药物化学与CMC",
    enName: "Medicinal Chemistry & CMC",
    icon: "🧪",
    desc: "原料药、制剂与工艺控制术语",
    words: [
      { word: "API", pos: "n.", phonetic: "/eɪ piː ˈaɪ/", cn: "原料药／活性药物成分（Active Pharmaceutical Ingredient）", en: "The API was synthesized in-house.", cn: "该原料药为自主合成。" },
      { word: "excipient", pos: "n.", phonetic: "/ɪkˈsɪpiənt/", cn: "辅料", en: "The excipient improved tablet compressibility.", cn: "该辅料改善了片剂可压性。" },
      { word: "impurity", pos: "n.", phonetic: "/ɪmˈpjʊərəti/", cn: "杂质", en: "Genotoxic impurities were strictly controlled.", cn: "遗传毒性杂质受到严格控制。" },
      { word: "polymorphism", pos: "n.", phonetic: "/ˌpɒlɪˈmɔːfɪzəm/", cn: "多态性（晶型）", en: "Polymorphism affects dissolution rate.", cn: "多态性影响溶出速率。" },
      { word: "solubility", pos: "n.", phonetic: "/ˌsɒljəˈbɪləti/", cn: "溶解度", en: "Poor solubility limited oral absorption.", cn: "溶解度差限制了口服吸收。" },
      { word: "bioavailability", pos: "n.", phonetic: "/ˌbaɪəʊəveɪləˈbɪləti/", cn: "生物利用度", en: "The new formulation raised bioavailability.", cn: "新处方提高了生物利用度。" },
      { word: "stability", pos: "n.", phonetic: "/stəˈbɪləti/", cn: "稳定性", en: "Stability studies supported a 24-month shelf life.", cn: "稳定性研究支撑了 24 个月有效期。" },
      { word: "shelf life", pos: "n.", phonetic: "/ʃelf laɪf/", cn: "有效期／货架期", en: "The shelf life was set at 36 months.", cn: "有效期定为 36 个月。" },
      { word: "dosage form", pos: "n.", phonetic: "/ˈdəʊsɪdʒ fɔːm/", cn: "剂型", en: "The optimal dosage form was an oral tablet.", cn: "最优剂型为口服片剂。" },
      { word: "tablet", pos: "n.", phonetic: "/ˈtæblət/", cn: "片剂", en: "The tablet was film-coated for stability.", cn: "该片剂为薄膜包衣以提高稳定性。" },
      { word: "capsule", pos: "n.", phonetic: "/ˈkæpsjuːl/", cn: "胶囊剂", en: "A softgel capsule improved patient compliance.", cn: "软胶囊提高了患者依从性。" },
      { word: "parenteral", pos: "adj.", phonetic: "/pəˈrentərəl/", cn: "注射给药的", en: "The parenteral route bypassed first-pass metabolism.", cn: "注射途径规避了首过代谢。" },
      { word: "formulation", pos: "n.", phonetic: "/ˌfɔːmjuˈleɪʃn/", cn: "处方／制剂", en: "The formulation was optimized for taste.", cn: "该处方针对口感进行了优化。" },
      { word: "degradation", pos: "n.", phonetic: "/ˌdeɡrəˈdeɪʃn/", cn: "降解", en: "Oxidative degradation was the main pathway.", cn: "氧化降解是主要途径。" },
      { word: "particle size", pos: "n.", phonetic: "/ˈpɑːtɪkl saɪz/", cn: "粒径", en: "Particle size influenced dissolution.", cn: "粒径影响溶出。" }
    ]
  },
  {
    id: "qcqa",
    name: "质量与检测",
    enName: "QC / QA",
    icon: "🔬",
    desc: "质量控制、质量保证与合规术语",
    words: [
      { word: "specification", pos: "n.", phonetic: "/ˌspesɪfɪˈkeɪʃn/", cn: "质量标准／规格", en: "The release specification was tightened.", cn: "放行质量标准被收紧。" },
      { word: "assay", pos: "n.", phonetic: "/ˈæseɪ/", cn: "含量测定", en: "An HPLC assay quantified the active.", cn: "HPLC 含量测定对活性成分定量。" },
      { word: "validation", pos: "n.", phonetic: "/ˌvælɪˈdeɪʃn/", cn: "验证", en: "Process validation confirmed reproducibility.", cn: "工艺验证确认了可重现性。" },
      { word: "calibration", pos: "n.", phonetic: "/ˌkælɪˈbreɪʃn/", cn: "校准", en: "Annual calibration ensured instrument accuracy.", cn: "年度校准保证了仪器准确性。" },
      { word: "OOS", pos: "n.", phonetic: "/əʊ əʊ ˈes/", cn: "超标（Out of Specification）", en: "An OOS result triggered an investigation.", cn: "超标结果触发了调查。" },
      { word: "deviation", pos: "n.", phonetic: "/ˌdiːviˈeɪʃn/", cn: "偏差", en: "The deviation was assessed for impact.", cn: "对该偏差的影响进行了评估。" },
      { word: "CAPA", pos: "n.", phonetic: "/ˈkæpə/", cn: "纠正与预防措施（Corrective And Preventive Action）", en: "CAPA closed the root-cause gap.", cn: "CAPA 弥补了根本原因缺口。" },
      { word: "batch", pos: "n.", phonetic: "/bætʃ/", cn: "批次", en: "Each batch was sampled for release testing.", cn: "每批次均取样进行放行检验。" },
      { word: "release", pos: "n./v.", phonetic: "/rɪˈliːs/", cn: "放行", en: "QA released the batch after review.", cn: "QA 审核后放行了该批次。" },
      { word: "audit", pos: "n./v.", phonetic: "/ˈɔːdɪt/", cn: "审计／稽查", en: "A supplier audit was scheduled for Q3.", cn: "供应商审计安排在第三季度。" },
      { word: "change control", pos: "n.", phonetic: "/tʃeɪndʒ kənˈtrəʊl/", cn: "变更控制", en: "Change control governed the process update.", cn: "变更控制管理了工艺更新。" },
      { word: "trending", pos: "n.", phonetic: "/ˈtrendɪŋ/", cn: "趋势分析", en: "Annual trending detected no drift.", cn: "年度趋势分析未发现漂移。" }
    ]
  },
  {
    id: "business",
    name: "商务沟通",
    enName: "Business Communication",
    icon: "💼",
    desc: "职场邮件、会议与跨部门协作高频词",
    words: [
      { word: "follow up", pos: "phr.", phonetic: "/ˈfɒləʊ ʌp/", cn: "跟进", en: "Let me follow up with the regulatory team.", cn: "我来跟进注册团队的情况。" },
      { word: "agenda", pos: "n.", phonetic: "/əˈdʒendə/", cn: "议程", en: "Please share the meeting agenda in advance.", cn: "请提前分享会议议程。" },
      { word: "action item", pos: "n.", phonetic: "/ˈækʃn aɪtəm/", cn: "行动项", en: "Each action item has a named owner.", cn: "每个行动项都有指定负责人。" },
      { word: "deadline", pos: "n.", phonetic: "/ˈdedlaɪn/", cn: "截止日期", en: "The submission deadline is Friday.", cn: "申报截止日期是周五。" },
      { word: "align", pos: "v.", phonetic: "/əˈlaɪn/", cn: "对齐／达成一致", en: "We need to align on the strategy.", cn: "我们需要就策略达成一致。" },
      { word: "leverage", pos: "v.", phonetic: "/ˈliːvərɪdʒ/", cn: "利用／撬动", en: "We can leverage internal expertise.", cn: "我们可以利用内部专长。" },
      { word: "deliverable", pos: "n.", phonetic: "/dɪˈlɪvərəbl/", cn: "交付物", en: "The CTD module is the key deliverable.", cn: "CTD 模块是关键交付物。" },
      { word: "stakeholder", pos: "n.", phonetic: "/ˈsteɪkhəʊldə(r)/", cn: "利益相关方", en: "All stakeholders were notified.", cn: "所有利益相关方均已被告知。" },
      { word: "brief", pos: "v./n.", phonetic: "/briːf/", cn: "简报／简要说明", en: "Please brief the team before the call.", cn: "请在通话前给团队做简报。" },
      { word: "recap", pos: "n./v.", phonetic: "/ˈriːkæp/", cn: "回顾／总结", en: "Let me recap today's discussion.", cn: "我来回顾一下今天的讨论。" },
      { word: "touch base", pos: "phr.", phonetic: "/tʌtʃ beɪs/", cn: "联系／沟通", en: "I'll touch base with you next week.", cn: "我下周和你沟通一下。" },
      { word: "clarification", pos: "n.", phonetic: "/ˌklærəfɪˈkeɪʃn/", cn: "澄清", en: "We need clarification on the requirement.", cn: "我们需要就该项要求做出澄清。" }
    ]
  }
];

// 扁平化所有词（含自定义词），用于学习/测验
function getAllWords(customWords) {
  const list = [];
  PHARMA_BANKS.forEach(bank => {
    bank.words.forEach(w => list.push(Object.assign({ bankId: bank.id, bankName: bank.name }, w)));
  });
  (customWords || []).forEach(w => list.push(Object.assign({ bankId: "custom", bankName: "我的词库" }, w)));
  return list;
}
