const studentFields = ['intecId', 'name', 'subject', 'teacher', 'section', 'trimesterName'];

function setSubjects(subjects) {
  return;
}

function setTeachers(teachers) {
  return;
}

function filterData() {
  return;
}

const getUnfilteredData = async () => {
  console.log('will fetch students...');
  try {
    let trimesters = await QUERIES.getTrimesters();
    console.log(trimesters);
    // renderStudents(students);
  } catch(e) {
    console.log(e);
  }
}


function renderStudents(students) {
  let data = document.getElementById('stduents-data');
  for(let i = 0; i< students.length; i++) {
    let s = students[i];
    let tr = document.createElement('tr');
    for(let j = 0; j < studentFields.length; j++) {
      let field = studentFields[i];
      let td = document.createElement('td');
      td.innerHTML = s[field];
      tr.appendChild(td);
    }
    data.appendChild(tr);
  }
}

getUnfilteredData();