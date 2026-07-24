let radarChart = null;
let pieChart = null;
let barChart = null;



const predictBtn = document.getElementById("predictBtn");

const confidenceRing = document.getElementById("confidenceRing");

const ringLabel = document.getElementById("ringLabel");



predictBtn.addEventListener("click", predictCrop);




// GET INPUT VALUES

function getValues(){

    return {

        N:Number(document.getElementById("N").value),

        P:Number(document.getElementById("P").value),

        K:Number(document.getElementById("K").value),

        temperature:Number(document.getElementById("temperature").value),

        humidity:Number(document.getElementById("humidity").value),

        ph:Number(document.getElementById("ph").value),

        rainfall:Number(document.getElementById("rainfall").value)

    };

}




// LOADING

function startLoading(){

    predictBtn.disabled = true;

    predictBtn.innerHTML = 'Predicting<span class="btn-dots"><span></span><span></span><span></span></span>';

}



function stopLoading(){

    predictBtn.disabled = false;

    predictBtn.innerHTML = "Predict Crop";

}





// SEND DATA TO FLASK

async function predictCrop(){


    let values = getValues();


    startLoading();



    try{


        let response = await fetch("/predict",{


            method:"POST",


            headers:{


                "Content-Type":"application/json"


            },


            body:JSON.stringify(values)


        });



        let data = await response.json();



        stopLoading();




        if(!data.success){


            alert(data.error);

            return;

        }




        updatePrediction(data);

        updateInfo(data);

        updateStats(values);

        drawCharts(values,data);



    }


    catch(error){


        stopLoading();


        console.log(error);


        alert("Flask server not connected");


    }


}




// ANIMATE THE CONFIDENCE RING FROM ITS CURRENT VALUE TO A TARGET

let currentRingValue = 0;

function animateRing(target,color){

    const start = currentRingValue;

    const duration = 900;

    const startTime = performance.now();

    confidenceRing.style.setProperty("--ring-color", color || "var(--primary)");

    function tick(now){

        let progress = Math.min((now - startTime) / duration, 1);

        // ease-out cubic

        progress = 1 - Math.pow(1 - progress, 3);

        const value = Math.round(start + (target - start) * progress);

        confidenceRing.style.setProperty("--p", value);

        ringLabel.textContent = value + "%";

        if(progress < 1){

            requestAnimationFrame(tick);

        } else {

            currentRingValue = target;

        }

    }

    requestAnimationFrame(tick);

}




// UPDATE RESULT


function updatePrediction(data){


document.getElementById("cropName").innerHTML = data.crop;


document.getElementById("cropName").style.color = data.color;



document.getElementById("confidence").innerHTML =
data.confidence + "% Confidence";


document.getElementById("confidence").style.color = data.color;



animateRing(data.confidence, data.color);



const recBox = document.getElementById("recommendation");

recBox.style.borderLeftColor = data.color;



document.getElementById("recommendation").innerHTML =

data.confidence >= 80 ?

"Excellent conditions detected. This crop is highly suitable." :

data.confidence >= 60 ?

"Suitable conditions detected. Some improvements may increase yield." :

"Conditions are not ideal. Try another crop or improve soil.";

}







// UPDATE CROP DETAILS


function updateInfo(data){


document.getElementById("season").innerHTML =
data.season;


document.getElementById("soil").innerHTML =
data.soil;


document.getElementById("water").innerHTML =
data.water;


document.getElementById("yield").innerHTML =
data.yield;


}







// UPDATE TOP CARDS


function updateStats(values){


document.getElementById("statN").innerHTML =
values.N;


document.getElementById("statHumidity").innerHTML =
values.humidity+"%";


document.getElementById("statTemp").innerHTML =
values.temperature+"°C";


}




// CHART COLOR SYSTEM
// Nutrients (N,P,K) = greens · Climate (Temp,pH) = amber/coral · Water (Humidity,Rain) = blues
// Vivid, saturated tones — every chart reads the same story instead of one flat green.

const PARAM_COLORS = {

    N:"#16A34A",

    P:"#22C55E",

    K:"#4ADE80",

    Temp:"#FF6B4A",

    Humidity:"#0EA5E9",

    pH:"#F5A623",

    Rain:"#38BDF8"

};

const PARAM_ORDER = ["N","P","K","Temp","Humidity","pH","Rain"];

// max realistic value per parameter, used only to put every row on one shared 0-100 axis

const PARAM_MAX = {

    N:150,

    P:100,

    K:150,

    Temp:45,

    Humidity:100,

    pH:14,

    Rain:350

};


Chart.defaults.font.family = "'Inter', sans-serif";

Chart.defaults.color = "#5B6B62";

Chart.defaults.plugins.tooltip.backgroundColor = "#0F2E22";

Chart.defaults.plugins.tooltip.titleFont = { family:"'IBM Plex Mono', monospace", size:12, weight:"600" };

Chart.defaults.plugins.tooltip.bodyFont = { family:"'Inter', sans-serif", size:12 };

Chart.defaults.plugins.tooltip.padding = 10;

Chart.defaults.plugins.tooltip.cornerRadius = 8;

Chart.defaults.plugins.tooltip.displayColors = true;

Chart.defaults.plugins.tooltip.boxPadding = 4;


function hexToRgba(hex,alpha){

    const r = parseInt(hex.slice(1,3),16);

    const g = parseInt(hex.slice(3,5),16);

    const b = parseInt(hex.slice(5,7),16);

    return `rgba(${r},${g},${b},${alpha})`;

}


function verticalGradient(ctx,chartArea,colorTop,colorBottom){

    if(!chartArea) return colorTop;

    const gradient = ctx.createLinearGradient(0,chartArea.top,0,chartArea.bottom);

    gradient.addColorStop(0,colorTop);

    gradient.addColorStop(1,colorBottom);

    return gradient;

}


function normalize(value,paramKey){

    const max = PARAM_MAX[paramKey];

    return Math.max(0, Math.min(100, (value/max)*100));

}


// CENTER LABEL FOR THE RANKING DOUGHNUT — shows the top crop + its score

let lastCenterValue = { name:"—", value:0 };

const centerTextPlugin = {

    id:"centerText",

    afterDraw(chart){

        if(chart.canvas.id !== "pieChart") return;

        const { ctx, chartArea } = chart;

        if(!chartArea) return;

        const centerX = (chartArea.left + chartArea.right) / 2;

        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();

        ctx.textAlign = "center";

        ctx.textBaseline = "middle";

        ctx.font = "700 28px 'IBM Plex Mono', monospace";

        ctx.fillStyle = "#182620";

        ctx.fillText(lastCenterValue.value + "%", centerX, centerY - 10);

        ctx.font = "600 12px 'Inter', sans-serif";

        ctx.fillStyle = "#5B6B62";

        const label = lastCenterValue.name.length > 14 ? lastCenterValue.name.slice(0,13)+"…" : lastCenterValue.name;

        ctx.fillText(label.toUpperCase(), centerX, centerY + 16);

        ctx.restore();

    }

};

Chart.register(centerTextPlugin);




// DRAW ALL CHARTS


function drawCharts(values,data){


drawRadar(values);


drawRanking(data.ranking);


drawRangeChart(values,data.ranges);


}




// RADAR CHART


function drawRadar(values){


let ctx=document.getElementById("radarChart");



if(radarChart)
radarChart.destroy();



const pointColors = PARAM_ORDER.map(k=>PARAM_COLORS[k]);



radarChart=new Chart(ctx,{


type:"radar",


data:{


labels:[

"Nitrogen",
"Phosphorus",
"Potassium",
"Temperature",
"Humidity",
"pH",
"Rainfall"

],


datasets:[{


label:"Parameters",


data:[

values.N,
values.P,
values.K,
values.temperature,
values.humidity,
values.ph,
values.rainfall

],


backgroundColor:(context)=>{

const {chart}=context;

const {ctx:c,chartArea}=chart;

if(!chartArea) return hexToRgba("#0B8457",0.18);

const gradient=c.createLinearGradient(0,chartArea.top,0,chartArea.bottom);

gradient.addColorStop(0,hexToRgba("#10B981",0.34));

gradient.addColorStop(1,hexToRgba("#0EA5E9",0.06));

return gradient;

},


borderColor:"#0B8457",


borderWidth:2.5,


pointBackgroundColor:pointColors,


pointBorderColor:"#fff",


pointBorderWidth:2,


pointRadius:5,


pointHoverRadius:7,


pointHoverBorderWidth:3



}]


},


options:{


responsive:true,


maintainAspectRatio:false,


animation:{

duration:900,

easing:"easeOutCubic"

},


scales:{

r:{

grid:{ color:"#E1E8DE" },

angleLines:{ color:"#E1E8DE" },

pointLabels:{ font:{ size:12, weight:"600" }, color:"#182620" },

ticks:{ display:false, backdropColor:"transparent" },

suggestedMin:0

}

},


plugins:{

legend:{ display:false },

tooltip:{

callbacks:{

labelColor:(context)=>({

borderColor:"transparent",

backgroundColor:pointColors[context.dataIndex]

})

}

}

}


}


});


}




// CROP SUITABILITY RANKING — every crop as its own slice, biggest match first


function drawRanking(ranking){


let ctx=document.getElementById("pieChart");



if(pieChart)
pieChart.destroy();



lastCenterValue = { name: ranking[0] ? ranking[0].crop : "—", value: ranking[0] ? ranking[0].confidence : 0 };



pieChart=new Chart(ctx,{


type:"doughnut",


data:{


labels: ranking.map(item=>item.crop),


datasets:[{


data: ranking.map(item=>item.confidence),


backgroundColor: ranking.map(item=>item.color),


borderWidth:3,


borderColor:"#FFFFFF",


hoverOffset:10



}]


},


options:{


responsive:true,


maintainAspectRatio:false,


cutout:"68%",


rotation:-90,


animation:{

duration:1100,

easing:"easeOutCubic",

onProgress:(anim)=>{

const p = anim.currentStep / anim.numSteps;

lastCenterValue = {

name: ranking[0] ? ranking[0].crop : "—",

value: ranking[0] ? Math.round(ranking[0].confidence * p) : 0

};

},

onComplete:()=>{

lastCenterValue = { name: ranking[0] ? ranking[0].crop : "—", value: ranking[0] ? ranking[0].confidence : 0 };

}

},


plugins:{

legend:{

display:true,

position:"bottom",

labels:{

boxWidth:9,

boxHeight:9,

padding:12,

font:{ size:11, family:"'Inter', sans-serif" }

}

},


tooltip:{

callbacks:{

label:(context)=> `${context.label}: ${context.parsed}% match`

}

}

}


}



});



}




// PARAMETER FIT — pale band is the winning crop's ideal range,
// bright tick shows where your value actually falls on that same scale


function drawRangeChart(values,ranges){



let ctx=document.getElementById("barChart");



if(barChart)
barChart.destroy();



const rawValues = {

N:values.N, P:values.P, K:values.K, Temp:values.temperature,

Humidity:values.humidity, pH:values.ph, Rain:values.rainfall

};


const rawRanges = {

N:ranges.N, P:ranges.P, K:ranges.K, Temp:ranges.temperature,

Humidity:ranges.humidity, pH:ranges.ph, Rain:ranges.rainfall

};


const labels = ["Nitrogen","Phosphorus","Potassium","Temperature","Humidity","pH","Rainfall"];


const rangeData = PARAM_ORDER.map(k=>[

normalize(rawRanges[k][0],k),

normalize(rawRanges[k][1],k)

]);


const markerData = PARAM_ORDER.map(k=>{

const n = normalize(rawValues[k],k);

return [Math.max(0,n-1.4), Math.min(100,n+1.4)];

});


const barColors = PARAM_ORDER.map(k=>PARAM_COLORS[k]);



barChart=new Chart(ctx,{


type:"bar",


data:{


labels:labels,


datasets:[

{

label:"Ideal Range",


data:rangeData,


backgroundColor:barColors.map(c=>hexToRgba(c,0.20)),


borderRadius:8,


borderSkipped:false,


barThickness:18

},

{

label:"Your Value",


data:markerData,


backgroundColor:barColors,


borderRadius:4,


borderSkipped:false,


barThickness:18

}

]


},


options:{


indexAxis:"y",


responsive:true,


maintainAspectRatio:false,


animation:{

duration:900,

easing:"easeOutCubic",

delay:(context)=> context.datasetIndex===1 ? 500 + context.dataIndex*90 : context.dataIndex*90

},


scales:{

x:{

min:0,

max:100,

grid:{ color:"#E1E8DE" },

ticks:{ callback:(v)=>v+"%", font:{ size:10 } },

title:{ display:true, text:"% of typical maximum", font:{ size:10.5 } }

},

y:{

grid:{ display:false },

ticks:{ font:{ family:"'IBM Plex Mono', monospace", size:11, weight:"600" } },

stacked:false

}

},


plugins:{

legend:{

display:true,

position:"top",

align:"end",

labels:{ boxWidth:10, boxHeight:10, font:{ size:11.5 } }

},


tooltip:{

callbacks:{

title:(items)=>labels[items[0].dataIndex],

label:(context)=>{

const key = PARAM_ORDER[context.dataIndex];

if(context.datasetIndex===0){

return `Ideal: ${rawRanges[key][0]} – ${rawRanges[key][1]}`;

}

return `Your value: ${rawValues[key]}`;

}

}

}

}


}



});


}




// SCROLL-TRIGGERED REVEAL FOR ANALYTICS CARDS

function initScrollReveal(){

    const cards = document.querySelectorAll(".chart-card");

    const observer = new IntersectionObserver((entries)=>{

        entries.forEach((entry, i)=>{

            if(entry.isIntersecting){

                setTimeout(()=>{

                    entry.target.classList.add("in-view");

                }, i * 120);

                observer.unobserve(entry.target);

            }

        });

    },{ threshold:0.15 });

    cards.forEach(card=>observer.observe(card));

}




// LOAD DEFAULT CHARTS


window.onload=function(){


let values=getValues();


updateStats(values);


drawRadar(values);


drawRanking([{crop:"Awaiting input",confidence:0,color:"#0B8457"}]);


drawRangeChart(values,{N:[0,0],P:[0,0],K:[0,0],temperature:[0,0],humidity:[0,0],ph:[0,0],rainfall:[0,0]});


initScrollReveal();


};