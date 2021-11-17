/*
Exploration de données patrimoine
LMK, Maison MONA, projet patrimoine
*/

var allProps = [];


var widthChart = 500;
var heightChart = 500;
var arcs;
//crée un camembert :) 

//https://observablehq.com/@d3/pie-chart
function pieChart(data, doc) {
  console.log("make chart")
  console.log(data)

  var svg = d3.select(doc)
    .attr("viewBox", [-widthChart / 2, -heightChart / 2, widthChart, heightChart])

  const pie = d3.pie()
    .sort(null)
    .value(d => d.value);
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(Math.min(widthChart, heightChart) / 2 - 1);
  const color = d3.scaleOrdinal()
    .domain(data[0].map(d => d.name))
    .range(d3.quantize(t => d3.interpolateRainbow(t * 0.8 + 0.1), data[0].length).reverse())

  const radius = Math.min(widthChart, heightChart) / 2 * 0.8;
  const arcLabel = d3.arc().innerRadius(radius).outerRadius(radius);

  //ratio de 0 à 1
  const scalep = d3.scaleLinear()
    .domain([0, data[1]])
    .range([0, 1])
  //transforme le résultat en pourcentage
  var formatp = d3.format(".0%")

  arcs = pie(data[0]);

  svg.append("g")
    .attr("stroke", "white")
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("fill", d => color(d.data.name))
    .attr("d", arc)
    .append("title")
    .text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);

  svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(arcs)
    .join("text")
    .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
    .call(text => text.append("tspan")
      .attr("y", "-0.4em")
      .attr("font-weight", "bold")
      .text(d => d.data.name))
    .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
      .attr("x", 0)
      .attr("y", "0.7em")
      .attr("fill-opacity", 0.7)
      .text(d => formatp(scalep(d.data.value))));

  return svg.node();
}

//create index for mtl data
function indexMtl(data) {
  var indexMtl = {};
  var countMtl = 0;
  //index pour chaque type de zone, compte les occurrences
  data.features.forEach(f => {
    var zone = f.properties.zone_expl
    var codeZone = f.properties.type_zone

    if (!(codeZone in indexMtl)) {
      indexMtl[codeZone] = {
        name: zone,
        value: 0
      }
    }

    countMtl++;
    indexMtl[codeZone].value++;
  })

  var arrayMtl = [];
  //transforme l'index en un array
  for (i in indexMtl) {
    arrayMtl.push({
      name: indexMtl[i].name,
      value: indexMtl[i].value
    })
  
  }
  var name = "#svgMtl"
  //crée un pie chart avec les données
  pieChart([arrayMtl, countMtl], name)
}


function indexQc(data, name) {
  var count = 0; 
  var iUsage = {};
  var iSJuri = {};
  console.log(data)

  //index pour chaque type de zone, compte les occurrences
  data.forEach(f => {

    var usage = "non renseigné"
    if (f.usage && f.usage.length > 0)
      usage = f.usage;

    var autorite = "non renseigné"
    if (f.autorite && f.autorite.length > 0)
      autorite = f.autorite;
    
    if (!(usage in iUsage)) {
      iUsage[usage] = {
        name: usage,
        value: 0
      }
    }

    if (!(autorite in iSJuri)){
      iSJuri[autorite]= {
        name: autorite,
        value: 0
      }
    }

    iUsage[usage].value++; 
    iSJuri[autorite].value++; 
    count++;
  })


  var aUsage = [];
  //transforme l'index en un array
  for (i in iUsage) {
    aUsage.push({
      name: iUsage[i].name,
      value: iUsage[i].value
    })
  }
  var aSJuri = [];
  //transforme l'index en un array
  for (i in iSJuri) {
    aSJuri.push({
      name: iSJuri[i].name,
      value: iSJuri[i].value
    })
  }

  //crée un pie chart avec les données
  var doc = (name + 1).toLocaleString();
  pieChart([aUsage, count], doc)
  var doc = (name + 2).toLocaleString();
  pieChart([aSJuri, count], doc)
  
}


//format the properties of the dataset into occurrenceshtml
function formattext(prop) {

  //could be better / prettify with indent doesn't seem to work
  var exemple = JSON.stringify(prop.example, null, 4)

  var result = `<h4>${prop.titre}</h4>
                <ul>
                  <li>${prop.lieu}</li>
                  <li>${prop.entrees} entrées</li>
                  <li>Système de coordonnées géographiques: ${prop.systeme}</li>
                  <li>${prop.props}</li>
                </ul>
                <code>${exemple}</code>`

  return result;
}

function describeGeoJson(data, p, title, loc) {
  var info = {
    titre: title,
    lieu: loc
  }

  if (data.crs) {
    var crs = data.crs.properties.name
    info.systeme = crs;
  }

  var l = data.features.length;
  info.entrees = l;
  //console.log("nombre d'entrées = " + l)

  var exemple0 = data.features[0]
  info.example = exemple0

  //list of properties
  //for now, since they are from the same data source, I'm trusting that all have the same properties, though some may be null 
  var proprietes = Object.keys(exemple0.properties)
  info.props = proprietes
  allProps.push({
    nom: title,
    props: proprietes
  })

  //ajoute les informations dans la section du html
  p.html(formattext(info))
}

function describeCSV(data, p, title, loc) {
  var info = {
    titre: title,
    lieu: loc
  }

  var l = data.length;
  info.entrees = l;
  //console.log("nombre d'entrées = " + l)

  var exemple0 = data[0]

  var crs = `point, latitude & longitude` + (exemple0.geometrie ? `<code> ${exemple0.geometrie}</code>` : "");
  info.systeme = crs;

  info.example = exemple0

  //list of properties
  //for now, since they are from the same data source, I'm trusting that all have the same properties, though some may be null 
  var proprietes = Object.keys(exemple0)
  info.props = proprietes
  allProps.push({
    nom: title,
    props: proprietes
  })

  p.html(formattext(info))
}

Promise.all([
  d3.json('../../data/patMtl.json'),
  d3.csv('../../data/imMuni.csv'),
  d3.csv('../../data/imMCC.csv'),
  d3.csv('../../data/siMuni.csv'),
  d3.csv('../../data/siLoi.csv'),
  d3.csv('../../data/siMCC.csv'),
]).then(([patMtl, imMuni, imMCC, siMuni, siLoi, siMCC]) => {
  /*est-ce que je peux donner un nom au array de résultats pour ensuite faire array.forEach ? */


  var p1 = d3.select("#patMtl");
  var titre1 = "Sites et immeubles protégés en vertu de la Loi sur le patrimoine culturel"
  var mtl = "Montréal"
  describeGeoJson(patMtl, p1, titre1, mtl)
  indexMtl(patMtl)



  var qc = "Québec"

  var p2 = d3.select("#imMuni");
  var titre2 = "Immeubles patrimoniaux cités par les municipalités"
  describeCSV(imMuni, p2, titre2, qc)
  indexQc(imMuni, "#imMuni")

  var p3 = d3.select("#imMCC");
  var titre3 = "Immeubles patrimoniaux classés par le ministre de la Culture et des Communications"
  describeCSV(imMCC, p3, titre3, qc)
  indexQc(imMCC, "#imMCC")

  var p4 = d3.select("#siMuni");
  var titre4 = "Sites patrimoniaux cités par les municipalités"
  describeCSV(siMuni, p4, titre4, qc)

  var p5 = d3.select("#siLoi");
  var titre5 = "Site patrimonial national déclaré par la Loi sur le patrimoine culturel par le gouvernement du Québec"
  describeCSV(siLoi, p5, titre5, qc)

  var p6 = d3.select("#siMCC");
  var titre6 = "Sites patrimoniaux classés par le ministre de la Culture et des Communications"
  describeCSV(siMCC, p6, titre6, qc)


  var compare = ``
  allProps.forEach(d => {

    var props = ``
    d.props.forEach(p => props = props + `<li>${p}</li>`)

    compare = compare + `<div class="grid-item">
            <b>${d.nom}</b>
            <ul>${props}</ul></div>`
  })

  d3.select("#compareProps").html(compare)



}).catch(function (error) {
  console.log(error);
});


