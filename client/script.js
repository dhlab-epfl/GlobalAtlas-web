var MapObject     = {};
var EntityObject  = {};
var SliderObject  = {};
var CreatorObject = {};
var EditorObject  = {}

var settings_api_url = '/api/api.php';

var hash = {};

$(function(){

    getHash();

    MapObject.init();
    SliderObject.init();
    EntityObject.init();
});

function setHash(key, value){
    location.hash = JSON.stringify(hash);
}

function getHash(){
    if( location.hash.substring(1) ){
        try{
            hash = JSON.parse(location.hash.substring(1));
        }
        catch(e){
            alert(e);
        }
    }
}
