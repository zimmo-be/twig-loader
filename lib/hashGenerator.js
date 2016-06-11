module.exports = function(id){
    var hash = 0;
    if (id.length == 0) return hash;
    for (i = 0; i < id.length; i++) {
        char = id.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}