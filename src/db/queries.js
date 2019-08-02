const ConfigModel = require('../models/config');
const RuleModel = require('../models/rule');
const TrimesterModel = require('../models/trimesters');
const HistoryStudentModel = require('../models/historyStudent');
const HistoryTeacherModel = require('../models/historyTecher');
const BlackListModel = require('../models/blackList');
const SubjectModel = require('../models/subject');

// CONFIGS
const getConfigs = () => {
  return ConfigModel.find({}, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving configurations: ', err);
      return null;
    }
    return docs;
  }).lean();
}

// RULES
const getRules = () => {
  return RuleModel.find({}, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving rules: ', err);
      return null;
    }
    return docs;
  }).lean();
}
const updateRule = (rule) => {
  return RuleModel.updateOne({number: rule.number}, rule, (err, doc) => {
    if (!!err) {
      console.log('Error update rule: ', err);
      return null;
    }
    return doc;
  });
}
const deleteRule = (rule) => {
  return RuleModel.findOneAndDelete({number: rule.number}, (err) => {
    if (!!err) {
      console.log('Error deleting rule: ', err);
      return null;
    }
  });
}
const addRule = (rule) => {
  return RuleModel.create(rule, (err) => {
    if (!!err) {
      console.log('Error addding rule: ', err);
      return null;
    }
  });
}
const updateRuleByText = (rule) => {
  return RuleModel.updateOne({text: rule.text}, rule, (err, doc) => {
    if (!!err) {
      console.log('Error updating rule: ', err);
      return null;
    }
    return doc;
  });
}
const updateRulesNumbers = (rules) => {
  rules.forEach(async (rule, idx) => {
    await updateRuleByText({text: rule.text, number: idx + 1});
  })
}

// TRIMESTERS
const getTrimesters = () => {
  return TrimesterModel.find({}, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving Trimesters: ', err);
      return null;
    }
    return docs;
  }).lean();
}
const determineTrimesterCustomId = (trimester) => {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  let startDate = new Date(trimester.start);
  let endDate = new Date(trimester.ends);
  let startMonth = monthNames[startDate.getMonth()];
  let endMonth = monthNames[endDate.getMonth()];
  let finishYear = endDate.getFullYear();
  return `${startMonth[0].toUpperCase()}-${endMonth[0].toUpperCase()}-${finishYear}`;
}
const updateTrimester = (trimester) => {
  let sanitazed = {
    name: trimester.name,
    start: new Date(trimester.start),
    ends: new Date(trimester.ends),
    lastModified: new Date(),
    customId: determineTrimesterCustomId(trimester),
  };
  return TrimesterModel.updateOne({customId: trimester.customId}, sanitazed, (err, doc) => {
    if (!!err) {
      console.log('Error update trimester: ', err);
      return null;
    }
    return doc;
  });
}
const addTrimester = (trimester) => {
  let sanitazed = {
    name: trimester.name,
    start: new Date(trimester.start),
    ends: new Date(trimester.ends),
    lastModified: undefined,
    customId: determineTrimesterCustomId(trimester),
  };
  return TrimesterModel.create(sanitazed, (err, doc) => {
    if (!!err) {
      console.log('Error adding trimester: ', err);
      return null;
    }
    return doc;
  });
}
const getCurrentTrimester = () => {
  const todayDate = Date.now();
  return TrimesterModel.find({
    start: {
      '$lte': todayDate
    },
    ends: {
      '$gte': todayDate
    }
  }, (err, docs) => {
    if (err) {
      console.error(err);
      return;
    }
  }).lean();
}

// History Students
const getHistoryStudents = () => {
  return HistoryStudentModel.find({}, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving student: ', err);
      return null;
    }
    return docs;
  }).lean();
}
const getHistoryStudentsFiltered = (filterObject) => {
  return HistoryStudentModel.find(!!filterObject ? filterObject : {}, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving student: ', err);
      return null;
    }
    return docs;
  }).lean();
}
const getStudents = (intecId) => {
  return HistoryStudentModel.find({}, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving student: ', err);
      return null;
    }
    return docs;
  }).lean();
}
const addStudent = (student) => {
  return HistoryStudentModel.create(student, (err, doc) => {
    if (!!err) {
      console.log('Error creating student: ', err);
      return null;
    }
    return doc;
  });
}
const getStudentInCurrentTrimester = async (currentTrimester, userName) => {
  // TODO: Get student with createdAt date betwwen current trimester
  const result = await HistoryStudentModel.find({
    createdAt: {
      '$gte': new Date(currentTrimester.start),
      '$lte': new Date(currentTrimester.ends)
    },
    intecId: userName
  }, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving student: ', err);
      return null;
    }
    return docs;
  }).lean();
  return result;
}

// History Teachers
const getTeachers = (intecId) => {
  return HistoryTeacherModel.find({}, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving teacher: ', err);
      return null;
    }
    return docs;
  }).lean().exec();
}
const addTeacher = (teacher) => {
  return HistoryTeacherModel.create(teacher, (err, doc) => {
    if (!!err) {
      console.log('Error creating teacher: ', err);
      return null;
    }
    return doc;
  }).lean().exec();
}
const getTeacherInCurrentTrimester = async (currentTrimester, userName) => {
  // TODO: Get student with createdAt date betwwen current trimester
  const result = await HistoryTeacherModel.find({
    createdAt: {
      '$gte': new Date(currentTrimester.start),
      '$lte': new Date(currentTrimester.ends)
    },
    intecId: userName
  }, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving student: ', err);
      return null;
    }
    return docs;
  }).lean();
  return result;
}

// user common
const updateSurveyStatus = (user, value) => {
  if (user.domain.toLowerCase() === "intec") {
    return HistoryStudentModel.updateOne({intecId: user.intecId}, { hasFilledSurvey: value }, (err, doc) => {
      if (!!err) {
        console.log('Error creating teacher: ', err);
        return null;
      }
      return doc;
    }).lean().exec();

  } else {
    return HistoryTeacherModel.updateOne({intecId: user.intecId}, { hasFilledSurvey: value }, (err, doc) => {
      if (!!err) {
        console.log('Error creating teacher: ', err);
        return null;
      }
      return doc;
    }).lean().exec();
  }
}
const getUser = (intecId, domain) => {
  if (domain.toLowerCase() === "intec") {
    return HistoryStudentModel.findOne({intecId: intecId}, (err, doc) => {
      if (!!err) {
        console.log('Error getting user with id: ', intecId, ' Error: ', err);
        return;
      }
      return doc;
    }).lean()
  } else {
    return HistoryTeacherModel.findOne({intecId: intecId}, (err, doc) => {
      if (!!err) {
        console.log('Error getting user with id: ', intecId, ' Error: ', err);
        return;
      }
      return doc;
    }).lean()
  }
}

// BlackList
const getBlackListUsers = () => {
  return BlackListModel.find({}, (err, docs) => {
    if (!!err) {
      console.log('Error retreiving Trimesters: ', err);
      return null;
    }
    return docs;
  }).lean();
}
const addBlackListUser = (intecId, domain) => {
  return BlackListModel.create({intecId: intecId, domain: domain}, (err) => {
    if (!!err) {
      console.log('Error retreiving Trimesters: ', err);
      return null;
    }
  });
}
const deleteBlackListUser = (intecId) => {
  return BlackListModel.findOneAndDelete({intecId: intecId}, (err) => {
    if (!!err) {
      console.log('Error retreiving Trimesters: ', err);
      return null;
    }
  });
}


const getSubjects = () => {
  return SubjectModel.find({}, (err) => {
    if (!!err) {
      console.log('Error retreiving Subjects: ', err);
      return null;
    }
  }).lean()
}

module.exports = {
  getConfigs,
  getRules,
  getTrimesters,
  getCurrentTrimester,
  getStudents,
  getTeachers,
  addStudent,
  addTeacher,
  getStudentInCurrentTrimester,
  getTeacherInCurrentTrimester,
  updateSurveyStatus,
  getBlackListUsers,
  addBlackListUser,
  deleteBlackListUser,
  getUser,
  getHistoryStudents,
  getSubjects,
  getHistoryStudentsFiltered,
  updateRule,
  deleteRule,
  addRule,
  updateRulesNumbers,
  updateRuleByText,
  updateTrimester,
  addTrimester,
}