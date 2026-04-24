const diseaseSelect = document.getElementById("diseaseSelect");
const formsArea = document.getElementById("formsArea");
const predictBtn = document.getElementById("predictBtn");
const resetBtn = document.getElementById("resetBtn");
const resultArea = document.getElementById("resultArea");
const resultBox = document.getElementById("resultBox");

diseaseSelect.addEventListener("change", () => {
  renderForm(diseaseSelect.value);
  resultArea.style.display = "none";
});

resetBtn.addEventListener("click", () => {
  diseaseSelect.value = "";
  formsArea.innerHTML = "";
  resultArea.style.display = "none";
});

predictBtn.addEventListener("click", async () => {
  const disease = diseaseSelect.value;
  if (!disease) {
    alert("Choose a disease first");
    return;
  }
  const formEl = document.querySelector("#form-" + disease);
  if (!formEl) {
    alert("Form not found");
    return;
  }
  const formData = new FormData(formEl);
  formData.append("disease", disease);

  resultBox.innerHTML = "Predicting...";
  resultArea.style.display = "block";

  try {
    const resp = await fetch("/predict", { method: "POST", body: formData });
    const json = await resp.json();
    if (!resp.ok) {
      resultBox.innerHTML = `<strong>Error:</strong> ${json.error || JSON.stringify(json)}`;
      return;
    }
    resultBox.innerHTML = `<strong>${json.disease}</strong><br/>Prediction: <strong>${json.prediction}</strong><br/>Confidence: <strong>${json.confidence}%</strong>`;
  } catch (e) {
    resultBox.innerHTML = `<strong>Error:</strong> ${e.toString()}`;
  }
});

function renderForm(key) {
  formsArea.innerHTML = "";
  if (key === "heart") formsArea.innerHTML = heartForm();
  if (key === "liver") formsArea.innerHTML = liverForm();
  if (key === "brain") formsArea.innerHTML = imageForm("brain");
  if (key === "lung") formsArea.innerHTML = imageForm("lung");
  if (key === "ckd") formsArea.innerHTML = ckdForm();
  attachImagePreview();
}

function attachImagePreview() {
  const fileInputs = document.querySelectorAll("input[type=file]");
  fileInputs.forEach(inp => {
    inp.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const id = e.target.getAttribute("data-preview");
      const img = document.getElementById(id);
      if (file && img) {
        const url = URL.createObjectURL(file);
        img.src = url;
        img.style.display = "block";
      }
    });
  });
}

function imageForm(type) {
  return `
  <form id="form-${type}" class="form-section">
    <div class="mb-3">
      <label class="form-label">Upload image (JPG/PNG)</label>
      <input type="file" accept="image/*" class="form-control" name="file" data-preview="preview-${type}">
    </div>
    <div class="mb-3">
      <img id="preview-${type}" class="preview-img" style="display:none"/>
    </div>
    <div class="small-note">Preview shown above. Click Predict to send image to server.</div>
  </form>`;
}

function heartForm() {
  return `
  <form id="form-heart" class="form-section">
    <div class="row g-2">
      <div class="col-md-3">
        <label class="form-label">Age</label>
        <input name="age" type="number" min="20" max="100" value="45" class="form-control" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Sex</label>
        <select name="sex" class="form-select"><option value="1">Male</option><option value="0">Female</option></select>
      </div>
      <div class="col-md-3">
        <label class="form-label">Chest Pain Type</label>
        <select name="cp" class="form-select"><option value="0">Typical Angina</option><option value="1">Atypical</option><option value="2">Non-anginal</option><option value="3">Asymptomatic</option></select>
      </div>
      <div class="col-md-3">
        <label class="form-label">Resting BP</label>
        <input name="trestbps" type="number" min="80" max="200" value="120" class="form-control" />
      </div>
      <div class="col-md-3 mt-2">
        <label class="form-label">Cholesterol</label>
        <input name="chol" type="number" min="100" max="600" value="200" class="form-control" />
      </div>
      <div class="col-md-3 mt-2">
        <label class="form-label">Fasting BS (>120)</label>
        <select name="fbs" class="form-select"><option value="0">No</option><option value="1">Yes</option></select>
      </div>
      <div class="col-md-3 mt-2">
        <label class="form-label">Resting ECG</label>
        <select name="restecg" class="form-select"><option value="0">Normal</option><option value="1">ST-T Abnormality</option><option value="2">LVH</option></select>
      </div>
      <div class="col-md-3 mt-2">
        <label class="form-label">Max Heart Rate (thalach)</label>
        <input name="thalach" type="number" min="60" max="220" value="150" class="form-control" />
      </div>
      <div class="col-md-3 mt-2">
        <label class="form-label">Exercise induced angina</label>
        <select name="exang" class="form-select"><option value="0">No</option><option value="1">Yes</option></select>
      </div>
      <div class="col-md-3 mt-2">
        <label class="form-label">Oldpeak (ST depression)</label>
        <input name="oldpeak" type="number" step="0.1" min="0" max="7" value="1.0" class="form-control" />
      </div>
      <div class="col-md-3 mt-2">
        <label class="form-label">ST Slope</label>
        <select name="slope" class="form-select"><option value="0">Upsloping</option><option value="1">Flat</option><option value="2">Downsloping</option></select>
      </div>
    </div>
  </form>`;
}

function liverForm() {
  return `
  <form id="form-liver" class="form-section">
    <div class="row g-2">
      <div class="col-md-3"><label class="form-label">Age</label><input name="age" type="number" step="1" class="form-control" /></div>
      <div class="col-md-3"><label class="form-label">Sex</label><select name="sex" class="form-select"><option value="M">M</option><option value="F">F</option></select></div>
      <div class="col-md-3"><label class="form-label">Drug</label><input name="drug" class="form-control" /></div>
      <div class="col-md-3"><label class="form-label">N_Days</label><input name="n_days" type="number" class="form-control" /></div>

      <div class="col-md-3 mt-2"><label class="form-label">Ascites (Y/N)</label><input name="ascites" class="form-control" /></div>
      <div class="col-md-3 mt-2"><label class="form-label">Hepatomegaly (Y/N)</label><input name="hepatomegaly" class="form-control" /></div>
      <div class="col-md-3 mt-2"><label class="form-label">Spiders (Y/N)</label><input name="spiders" class="form-control" /></div>
      <div class="col-md-3 mt-2"><label class="form-label">Edema (N/S/Y)</label><input name="edema" class="form-control" /></div>

      <div class="col-md-3 mt-2"><label class="form-label">Bilirubin</label><input name="bilirubin" type="number" step="0.01" class="form-control" /></div>
      <div class="col-md-3 mt-2"><label class="form-label">Cholesterol</label><input name="cholesterol" type="number" step="0.1" class="form-control" /></div>
      <div class="col-md-3 mt-2"><label class="form-label">Albumin</label><input name="albumin" type="number" step="0.01" class="form-control" /></div>
      <div class="col-md-3 mt-2"><label class="form-label">Copper</label><input name="copper" type="number" step="0.1" class="form-control" /></div>

      <div class="col-md-3 mt-2"><label class="form-label">Alk Phos</label><input name="alk_phos" type="number" step="0.1" class="form-control" /></div>
      <div class="col-md-3 mt-2"><label class="form-label">SGOT</label><input name="sgot" type="number" step="0.1" class="form-control" /></div>
      <div class="col-md-3 mt-2"><label class="form-label">Tryglicerides</label><input name="tryglicerides" type="number" step="0.1" class="form-control" /></div>
      <div class="col-md-3 mt-2"><label class="form-label">Platelets</label><input name="platelets" type="number" step="0.1" class="form-control" /></div>

      <div class="col-md-3 mt-2"><label class="form-label">Prothrombin</label><input name="prothrombin" type="number" step="0.1" class="form-control" /></div>
    </div>
  </form>`;
}

function ckdForm() {
  return `
  <form id="form-ckd" class="form-section">
    <div class="row g-2">
      <div class="col-md-3"><label>Age</label><input name="age" type="number" class="form-control"/></div>
      <div class="col-md-3"><label>Blood Pressure</label><input name="bp" type="number" class="form-control"/></div>
      <div class="col-md-3"><label>Specific Gravity</label><input name="sg" type="number" step="0.01" class="form-control"/></div>
      <div class="col-md-3"><label>Albumin</label><input name="al" type="number" step="0.01" class="form-control"/></div>
      <div class="col-md-3 mt-2"><label>Serum Creatinine</label><input name="sc" type="number" step="0.01" class="form-control"/></div>
      <div class="col-md-3 mt-2"><label>Hemoglobin</label><input name="hemo" type="number" step="0.1" class="form-control"/></div>
      <div class="col-md-3 mt-2"><label>Pus Cell (Normal/Abnormal)</label><select name="pc" class="form-select"><option value="Normal">Normal</option><option value="Abnormal">Abnormal</option></select></div>
      <div class="col-md-3 mt-2"><label>Sugar</label><input name="su" type="number" step="0.01" class="form-control"/></div>
      <div class="col-md-3 mt-2"><label>Red Blood Cells (Normal/Abnormal)</label><select name="rbc" class="form-select"><option value="Normal">Normal</option><option value="Abnormal">Abnormal</option></select></div>
      <div class="col-md-3 mt-2"><label>Pus Cell Clumps </label><select name="pcc" class="form-select"><option value="Present">Present</option><option value="Not Present">Not Present</option></select></div>
      <div class="col-md-3 mt-2"><label>Bacteria (Present/Not Present)</label><select name="ba" class="form-select"><option value="Present">Present</option><option value="Not Present">Not Present</option></select></div>
      <div class="col-md-3 mt-2"><label>Hypertension (Yes/No)</label><select name="htn" class="form-select"><option value="Yes">Yes</option><option value="No">No</option></select></div>
      <div class="col-md-3 mt-2"><label>Diabetes Mellitus (Yes/No)</label><select name="dm" class="form-select"><option value="Yes">Yes</option><option value="No">No</option></select></div>
      <div class="col-md-3 mt-2"><label>Coronary Artery Disease (Yes/No)</label><select name="cad" class="form-select"><option value="Yes">Yes</option><option value="No">No</option></select></div>
      <div class="col-md-3 mt-2"><label>Appetite (Good/Poor)</label><select name="appet" class="form-select"><option value="Good">Good</option><option value="Poor">Poor</option></select></div>
      <div class="col-md-3 mt-2"><label>Pedal Edema (Yes/No)</label><select name="pe" class="form-select"><option value="Yes">Yes</option><option value="No">No</option></select></div>
      <div class="col-md-3 mt-2"><label>Anemia (Yes/No)</label><select name="ane" class="form-select"><option value="Yes">Yes</option><option value="No">No</option></select></div>
    </div>
    <div class="small-note mt-2">
     
    </div>
  </form>`;
}