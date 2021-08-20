window.jsPDF = window.jspdf.jsPDF;

function generateAttackLayerCall(){
    toPost = {}
    techniques = [];
    var positionCounter = 0;
    for (let [key, stringValue] of Object.entries(localStorage)) {
        if (key.match(/^T/)){
            value = JSON.parse(stringValue);
            let tid = value.tid;
            let tactics = value.tactic;
            let score = value.score;
            var techniqueComment = "";
            var mitigations = value.mitigations;

            for (let [key, mitigation] of Object.entries(mitigations)){
                if (mitigation.notes != ""){
                    techniqueComment += mitigation.mitigation_name + "(" +mitigation.mid + ") Notes: " + mitigation.notes + "\n\n";
                }
                
            }

            var technique = {};
            technique["tid"] = tid;
            technique["tactics"] = tactics;
            technique["score"] = score;
            technique["comment"] = techniqueComment;
            techniques.push(technique);
            //positionCounter++;
        }    
    };
    toPost["domain"] = getCookie("domain");
    toPost["platforms"] = getCookie("platforms").split(',');
    toPost["techniques"] = techniques;

    apiGetLayer = 'https://sdf10urdoe.execute-api.eu-west-1.amazonaws.com/RiskBloXProd/attacklayer?layer=' + btoa(pako.deflate(JSON.stringify(toPost)));

    var navigator = document.getElementById("navIframe");

    url = "https://mitre-attack.github.io/attack-navigator/";
    // var domain = getCookie("domain");
    // domainMap = {"enterprise_attack":"enterprise",
    //              "mobile_attack": "mobile",
    //              "ics_attack": "ICS"};
    // urlDomain = domainMap[domain] + "/";
    
    completeURL = url + "#leave_site_dialog=false&header=false&legend=false&layerURL=" + apiGetLayer;
    
    navigator.setAttribute("src", completeURL);
}



function getCookie(name){
    var re = new RegExp(name += "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

function back(){
    window.location.replace("technique-forms.html");
}

function saveProgress(){;
    var savedJSON = {};
    savedJSON['cookies'] = document.cookie;
    techniques = {}
    for (let [key, stringValue] of Object.entries(localStorage)){
        
        if (key != "userAuth"){
            if (! ["tolerance","impactThreshold","scoreLimit"].includes(key)){
                techniques[key] = JSON.parse(stringValue);
            }
            else{
                techniques[key] = stringValue;
            }
        }    
    }
    savedJSON['techniques'] = techniques;
    download = document.createElement('a');

    const str = JSON.stringify(savedJSON);
    const bytes = new TextEncoder().encode(str);
    const blob = new Blob([bytes], {
        type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    download.href = url;
    download.download = "RiskBloX-Save.json";
    download.click();
}



function generateDocumentation(){
    var doc = new jsPDF({
        orientation: "landscape"
    });
    domain = getCookie("domains");
    platforms = getCookie("platforms");
    tactics = getCookie("tactics");
    groups = getCookie("groups");

    doc.setFontSize(30);
    doc.text("RiskBloX Report",110,100);

    for (let [key, stringValue] of Object.entries(localStorage)){
        if (key.startsWith("T")) {
            technique = JSON.parse(stringValue);
            description = technique.description;
            techniqueName = technique.tid +": "+ technique.technique_name;
            tactics = "Tactics: "+technique.tactic;
            score = technique.score;
            scoreString = "Score: "+technique.score;
            doc.addPage("landscape");
            doc.setFontSize(20);
            if (score <= 20){
                doc.setTextColor("#E50000");
            }
            else if (score <= 50){
                doc.setTextColor("#FFA500");
            }
            else if(score <= 80){
                doc.setTextColor("#E5E500");
            }
            else if(score <= 100){
                doc.setTextColor("#008000");
            }
            doc.text(techniqueName, 14, 22);
            doc.setFontSize(18);
            doc.text(scoreString, 240, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(tactics, 14,30);

            var pageSize = doc.internal.pageSize
            var pageWidth = pageSize.getWidth()
            var text = doc.splitTextToSize(description, pageWidth - 35, {})
            lengthText = doc.getTextDimensions(text).h;
            heightText = 35
            doc.text(text, 14, heightText)

            doc.autoTable({
                startY: lengthText+heightText,
                columnStyles: {0: {cellWidth: 25}, 1: {cellWidth: 70}, 2: {cellWidth: 70}, 3: {cellWidth: 45}, 4: {cellWidth: 25}, 5: {cellWidth: 30}},
                headStyles: {fillColor: '#0d6efd'},
                theme: 'grid',
                showHead : 'firstPage',
                rowPageBreak: 'avoid',
                head: [['Name', 'Description', 'Application', 'Notes', 'Positive Impact', 'Implementation Confidence']],
                body: bodyRows(technique.mitigations)
            })
        }
    doc.save('RiskBloX-Report.pdf')
}

function bodyRows(mitigations) {
    var body = []
    for (var j = 0; j < mitigations.length; j++) {
        mitgation = mitigations[j];
        let row = []
        row.push(mitgation.mid+": "+mitgation.mitigation_name,
                mitgation.description,
                mitgation.application,
                mitgation.notes,
                mitgation.impactLevel,
                mitgation.confidenceScore + "%"
                );
        body.push(row);
    }
    return body
  }


  function fetchIntegers(value) {
    // Find the trailing number or it will match the empty strin
    return value.match(/\d*$/)
}