$(document).ready(function(){
    var number_of_rows = 15
    var number_of_cols = 15
    
    var table_body;
    
    for(var i=0;i<number_of_rows;i++){
    table_body+='<tr>';
    for(var j=0;j<number_of_cols;j++){
        table_body += `<td><button class="tile" id="${i}_${j}"></button></td>`
    }
    table_body+='</tr>';
    }
    $('#tableBoard').html(table_body);
});