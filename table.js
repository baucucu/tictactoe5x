$(document).ready(function(){
    let number_of_rows = 15
    let number_of_cols = 15
    
    let table_body;
    
    for(let i=0;i<number_of_rows;i++){
    table_body+='<tr>';
    for(let j=0;j<number_of_cols;j++){
        table_body += `<td><button class="tile" id="${i}_${j}"></button></td>`
    }
    table_body+='</tr>';
    }
    $('#tableBoard').html(table_body);
});