let pdfText="";
let sumCount=0;
let quizCount=0;
let pdfCount=0;
let typingTimer;

const loader=document.getElementById("loader");
const output=document.getElementById("output");

/*  LOADER  */

function showLoader(){
  loader.classList.remove("hidden");
}

function hideLoader(){
  loader.classList.add("hidden");
}

/*  TYPING  */

function typeText(text){

  let i=0;
  output.innerText="";

  clearTimeout(typingTimer);

  function typing(){
    if(i<text.length){
      output.innerText+=text.charAt(i);
      i++;
      typingTimer=setTimeout(typing,10);
    }
  }

  typing();
}

/*  KEYWORDS  */

function extractKeywords(text){
  const words=text.match(/\b[A-Z][a-zA-Z]+\b/g)||[];
  return [...new Set(words)].slice(0,5);
}

/*  SUMMARY  */

function summarizeNotes(){

  let notes=
    document.getElementById("notes").value
    || pdfText;

  if(!notes){
    alert("Enter notes or upload PDF");
    return;
  }

  showLoader();

  setTimeout(()=>{

    hideLoader();

    let sentences=
      notes.split(".").slice(0,6);

    let summary="📌 Smart Summary:\n\n";

    sentences.forEach(s=>{
      if(s.trim()!==""){
        summary+="• "+s.trim()+"\n";
      }
    });

    summary+="\n🧠 Keywords:\n";

    extractKeywords(notes).forEach(k=>{
      summary+="• "+k+"\n";
    });

    typeText(summary);

    saveHistory("Summary",summary);

    sumCount++;
    document.getElementById("sumCount")
      .innerText=sumCount;

  },1000);
}

/*  QUIZ  */

function generateQuiz(){

  let notes=
    document.getElementById("notes").value
    || pdfText;

  if(!notes){
    alert("Enter notes or upload PDF");
    return;
  }

  showLoader();

  setTimeout(()=>{

    hideLoader();

    let keys=extractKeywords(notes);

    let quiz="📝 MCQ Quiz:\n\n";

    keys.forEach((k,i)=>{
      quiz+=`${i+1}. What is ${k}?\nA) Concept\nB) Algorithm\nC) Theory\nD) All\n\n`;
    });

    typeText(quiz);

    saveHistory("Quiz",quiz);

    quizCount++;
    document.getElementById("quizCount")
      .innerText=quizCount;

  },1000);
}

/* PDF UPLOAD */

document
.getElementById("pdfUpload")
.addEventListener("change",function(e){

  const file=e.target.files[0];
  if(!file) return;

  showLoader();

  const reader=new FileReader();

  reader.onload=function(){

    const typed=
      new Uint8Array(this.result);

    pdfjsLib.getDocument(typed)
    .promise.then(pdf=>{

      let pages=[];

      for(let i=1;i<=pdf.numPages;i++){

        pages.push(
          pdf.getPage(i).then(p=>
            p.getTextContent().then(c=>
              c.items.map(i=>i.str).join(" ")
            )
          )
        );
      }

      Promise.all(pages)
      .then(texts=>{

        hideLoader();

        pdfText=texts.join(" ");

        document
          .getElementById("notes")
          .value=pdfText;

        pdfCount++;
        document
          .getElementById("pdfCount")
          .innerText=pdfCount;

        alert("PDF text extracted");

      });

    });

  };

  reader.readAsArrayBuffer(file);

});

/*  DOWNLOAD PDF */

function downloadPDF(){

  const {jsPDF}=window.jspdf;
  const doc=new jsPDF();

  doc.text(output.innerText,10,10);
  doc.save("summary.pdf");
}

/*  THEME  */

function toggleTheme(){
  document.body.classList.toggle("dark");
}

/* HISTORY */

function saveHistory(type,data){

  let h=
    JSON.parse(
      localStorage.getItem("aiHistory")
    )||[];

  h.push({
    type,
    data,
    date:new Date().toLocaleString()
  });

  localStorage.setItem(
    "aiHistory",
    JSON.stringify(h)
  );
}

function viewHistory(){

  let h=
    JSON.parse(
      localStorage.getItem("aiHistory")
    )||[];

  if(!h.length){
    output.innerText="No history found.";
    return;
  }

  output.innerHTML="<h3>📜 History</h3>";

  h.forEach((item,index)=>{

    const div=document.createElement("div");

    div.innerHTML=`
      <b>${index+1}. ${item.type}</b>
      (${item.date})
      <button onclick="deleteHistory(${index})">
      ❌ Delete</button>
      <hr>
    `;

    output.appendChild(div);

  });

}

function deleteHistory(index){

  let h=
    JSON.parse(
      localStorage.getItem("aiHistory")
    )||[];

  h.splice(index,1);

  localStorage.setItem(
    "aiHistory",
    JSON.stringify(h)
  );

  viewHistory();
}

/* VOICE INPUT  */

function startVoice(){

  if(!('webkitSpeechRecognition' in window)){
    alert("Voice recognition not supported");
    return;
  }

  const recognition=
    new webkitSpeechRecognition();

  recognition.lang="en-US";
  recognition.start();

  recognition.onresult=function(e){

    const transcript=
      e.results[0][0].transcript;

    document
      .getElementById("notes")
      .value+=" "+transcript;

  };
}

/*  VOICE OUTPUT */

function speakSummary(){

  const text=output.innerText;

  if(!text){
    alert("No summary to speak!");
    return;
  }

  const speech=
    new SpeechSynthesisUtterance();

  speech.text=text;
  speech.lang="en-US";

  window.speechSynthesis.speak(speech);
}

/*  CLEAR ALL */

function clearAll(){

  clearTimeout(typingTimer);

  document.getElementById("notes").value="";
  document.getElementById("output").innerText="";
  document.getElementById("pdfUpload").value="";

  pdfText="";

  hideLoader();

  alert("All data cleared!");
}