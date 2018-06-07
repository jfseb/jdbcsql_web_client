

/*
var LUNRIndex = mdldata.lunrcolumns;

var elastic = elasticlunr(function () {
  var that = this;
  LUNRIndex .forEach(function(field) {
                  that.addField(field);
                });
  this.setRef('id');
  this.saveDocument(false);
});

var data = mdldata.fulldata;
data.forEach(function(record,index) {
  record.id = index;
  elastic.addDoc(record);
});
*/
/*
var str = JSON.stringify(elastic.toJSON());
console.log('\n' + serIndex.length + '\n' + str.length + '  different?');
*/
//elastic = elasticlunr.Index.load(JSON.parse(serIndex) /*str*/);

function makeElasticIndex(serIndex) {
  elastic = elasticlunr.Index.load(serIndex /*str*/);
}

console.log('did it');
