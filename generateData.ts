module GenerateData {
    let fs = require('fs');
    let _ = require('lodash');
    
    let categoryValues = 200;
    let measures = 10;
    let dataPointCount = categoryValues * measures;
    
    let sparsity = 0.10;
    
    let isScalar = false;
    
    let isSquare = true;
    
    let lowerBound = -100;
    let upperBound = 100;
    let range = upperBound - lowerBound;
    
    let precision = 0.001
    
    interface Row extends Array<string> {
    }
    
    interface Table extends Array<Row> {
    }
    
    function addSparsity(rows: Table): void {
        let targetCount: number = Math.round(sparsity * dataPointCount);
        
        replaceValues(rows, targetCount, "0");
    }
    
    function replaceValues(rows: Table, targetCount: number, value: string): void {
        let count = 0;
        while (count < targetCount) {
            let r = Math.round(Math.random() * (categoryValues - 1));
            let c = Math.round(Math.random() * (measures - 1));
            
            if (rows[r][c] !== value) {
                rows[r][c] = value;
                count++;
            }
        }
        
        console.log(count + " data points replaced with '" + value + "'");
    }
    
    function buildDataTable(): Table {
        let rows: Table = [];
        
        let count = 0;
        for (var c = 0; c < categoryValues; c++) {
          let row: Row = [];
          for (let m = 0; m < measures; m++) {
            let val = (Math.random() * range) + lowerBound;
        
            val = Math.round(val / precision) * precision;
        
            row.push(val.toString());
            count++;
          }
        
          rows.push(row);
        }
        
        console.log(count + " data points");
        
        return rows;
    }
    
    function getMeasureName(row: number): string {
        return "measure" + row;
    }
    
    function getCategoryValue(column: number): string {
        return "category" + column;
    }
    
    function toRowStr(row: Row): string {
        return row.join(',');
    }
    
    export function generateData() {
        // build values
        let table = buildDataTable();
        
        // add sparsity
        addSparsity(table);
        
        // convert to strings & add headers
        let lines: string[] = [];
        let header: Row = _.map(_.range(0, table[0].length), (i: number) => getMeasureName(i));
        header.unshift('Category');
        lines.push(toRowStr(header));
        for (let r = 0; r < table.length; r++) {
          let row = table[r];
          row.unshift(getCategoryValue(r));
          lines.push(toRowStr(row));
        }
        
        let content = lines.join('\r\n');
        
        fs.writeFile("data.csv", content);
    }
}

GenerateData.generateData();