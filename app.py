from flask import Flask, render_template, request, jsonify


app = Flask(__name__)



# Crop database

CROPS = {

    "Rice": {

        "N": (40,90),
        "P": (30,70),
        "K": (30,80),
        "temp": (20,35),
        "humidity": (60,90),
        "ph": (5,7),
        "rainfall": (150,300),

        "color":"#16A34A",
        "season":"Kharif",
        "soil":"Clay Soil",
        "water":"High",
        "yield":"4-6 tons/hectare"

    },


    "Wheat": {

        "N": (50,100),
        "P": (30,80),
        "K": (20,60),
        "temp": (10,25),
        "humidity": (40,70),
        "ph": (6,7.5),
        "rainfall": (50,150),

        "color":"#F59E0B",
        "season":"Rabi",
        "soil":"Loamy Soil",
        "water":"Medium",
        "yield":"3-5 tons/hectare"

    },


    "Maize": {

        "N": (40,80),
        "P": (20,60),
        "K": (20,70),
        "temp": (18,32),
        "humidity": (50,80),
        "ph": (5.5,7.5),
        "rainfall": (60,200),

        "color":"#FB923C",
        "season":"Kharif",
        "soil":"Loamy Soil",
        "water":"Medium",
        "yield":"3-4 tons/hectare"

    },


    "Cotton": {

        "N": (60,120),
        "P": (40,80),
        "K": (40,90),
        "temp": (25,40),
        "humidity": (50,75),
        "ph": (5.8,8),
        "rainfall": (50,150),

        "color":"#64748B",
        "season":"Kharif",
        "soil":"Black Soil",
        "water":"Medium",
        "yield":"2-3 tons/hectare"

    },


    "Sugarcane": {

        "N": (75,120),
        "P": (40,70),
        "K": (40,80),
        "temp": (21,32),
        "humidity": (65,85),
        "ph": (6,7.5),
        "rainfall": (150,300),

        "color":"#84CC16",
        "season":"Annual",
        "soil":"Loamy Soil",
        "water":"High",
        "yield":"70-90 tons/hectare"

    },


    "Soybean": {

        "N": (20,60),
        "P": (40,80),
        "K": (30,60),
        "temp": (20,30),
        "humidity": (60,80),
        "ph": (6,7),
        "rainfall": (60,150),

        "color":"#14B8A6",
        "season":"Kharif",
        "soil":"Loamy Soil",
        "water":"Medium",
        "yield":"2-3 tons/hectare"

    },


    "Barley": {

        "N": (40,80),
        "P": (20,50),
        "K": (20,50),
        "temp": (10,25),
        "humidity": (40,65),
        "ph": (6,8),
        "rainfall": (40,100),

        "color":"#CA8A04",
        "season":"Rabi",
        "soil":"Loamy Soil",
        "water":"Low",
        "yield":"2.5-4 tons/hectare"

    },


    "Millet": {

        "N": (30,60),
        "P": (20,40),
        "K": (20,40),
        "temp": (25,35),
        "humidity": (30,60),
        "ph": (5.5,7.5),
        "rainfall": (30,90),

        "color":"#E11D48",
        "season":"Kharif",
        "soil":"Sandy Soil",
        "water":"Low",
        "yield":"1-2 tons/hectare"

    },


    "Groundnut": {

        "N": (20,40),
        "P": (40,80),
        "K": (40,80),
        "temp": (22,32),
        "humidity": (50,75),
        "ph": (6,7),
        "rainfall": (50,125),

        "color":"#8B5E34",
        "season":"Kharif",
        "soil":"Sandy Loam",
        "water":"Medium",
        "yield":"1.5-2.5 tons/hectare"

    },


    "Potato": {

        "N": (80,140),
        "P": (60,100),
        "K": (80,140),
        "temp": (15,24),
        "humidity": (70,85),
        "ph": (5,6.5),
        "rainfall": (50,120),

        "color":"#7C3AED",
        "season":"Rabi",
        "soil":"Loamy Soil",
        "water":"Medium",
        "yield":"20-30 tons/hectare"

    }

}


PARAM_KEYS = ["N","P","K","temp","humidity","ph","rainfall"]

INPUT_KEYS = {"N":"N","P":"P","K":"K","temp":"temperature","humidity":"humidity","ph":"ph","rainfall":"rainfall"}




def score_crop(info, data):

    score = 0

    total = len(PARAM_KEYS)

    for key in PARAM_KEYS:

        low, high = info[key]

        value = data[INPUT_KEYS[key]]

        if low <= value <= high:
            score += 1

    return int((score/total)*100)




@app.route("/")
def home():

    return render_template("index.html")




@app.route("/predict", methods=["POST"])
def predict():


    data = request.json



    scored = []

    for crop, info in CROPS.items():

        confidence = score_crop(info, data)

        scored.append({

            "crop": crop,

            "confidence": confidence,

            "color": info["color"]

        })



    scored.sort(key=lambda item: item["confidence"], reverse=True)


    ranking = [item for item in scored if item["confidence"] > 0]

    if not ranking:
        ranking = scored


    best = ranking[0]

    best_crop = best["crop"]

    best_score = best["confidence"]

    result = CROPS[best_crop]



    ranges = {

        "N": list(result["N"]),

        "P": list(result["P"]),

        "K": list(result["K"]),

        "temperature": list(result["temp"]),

        "humidity": list(result["humidity"]),

        "ph": list(result["ph"]),

        "rainfall": list(result["rainfall"])

    }



    return jsonify({

        "success":True,

        "crop":best_crop,

        "confidence":best_score,

        "color":result["color"],

        "season":result["season"],

        "soil":result["soil"],

        "water":result["water"],

        "yield":result["yield"],

        "ranges":ranges,

        "ranking":ranking

    })




if __name__=="__main__":

    app.run(debug=True)