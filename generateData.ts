module GenerateData {
    let fs = require('fs');
    let _: _.LoDashStatic = require('lodash');
    let moment: moment.MomentStatic = require('moment');
    
    let zeroDate = new Date(2001, 1, 1).valueOf();
    let dateStep = 1000 * 60 * 60 * 24;  // 1 day
    
    interface MeasureValueOptions {
        sparsity: number;
        lowerBound: number;
        upperBound: number;
        precision: number;
    }
    
    interface CategoricalValueOptions {
        type: string;
    }
    
    interface Column extends Array<string> {
    }
    
    function addSparsity(columns: Column[], sparsity: number): void {
        // assume rectangular columns
        var dataPointCount = columns.length * columns[0].length;
        
        let targetCount: number = Math.round(sparsity * dataPointCount);
        
        replaceValues(columns, targetCount, "0");
    }
    
    function replaceValues(columns: Column[], targetCount: number, value: string): void {
        let count = 0;
        while (count < targetCount) {
            let c = Math.round(Math.random() * (columns.length - 1));
            let column = columns[c];
            
            let r = Math.round(Math.random() * (column.length - 1));
            if (column[r] !== value) {
                column[r] = value;
                count++;
            }
        }
        
        console.log(count + " data points replaced with '" + value + "'");
    }
    
    function roundToPrecision(value: number, precision: number): number {
        return Math.round(value / precision) * precision;
    }
    
    function randomNumber(range: number, lowerBound: number): number {
        return (Math.random() * range) + lowerBound;
    }
    
    function getMeasureName(id: number): string {
        return "measure" + id;
    }
    
    function formatDate(ticks: number): string {
        return moment(ticks).format('MM/DD/YYYY');
        //return date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear();
    }
    
    function getCategoryValue(id: number, categoryOptions: CategoricalValueOptions): string {
        if (categoryOptions.type === 'datetime') {
            return formatDate(zeroDate + (id * dateStep));
        }
        else {
            return "category" + id;
        }
    }
    
    function toRowStr(row: string[]): string {
        return row.join(',');
    }
    
    interface CategoryColumn {
        length: number;
        getValue: (i: number) => string;
        name: string;
    }
    
    interface MeasureColumn {
        getValue: (categoryValues: string[]) => string;
        name: string;
    }
    
    export function generateData() {
        let categoryColumns: CategoryColumn[] = [
            {
                length: 20,
                getValue: (i: number) => "cat1_" + i,
                name: "cat1",
            }, {
                length: 10,
                getValue: (i: number) => "cat2_" + i,
                name: "cat2",
            },  {
                length: 5,
                getValue: (i: number) => "cat3_" + i,
                name: "cat3",
            }
        ];
        
        let measureOptions: MeasureValueOptions = {
            sparsity: 0.10,
            isScalar: false,
            lowerBound: -100,
            upperBound: 100,
            precision: 0.001,
        };
        
        let measureColumns: MeasureColumn[] = [
            {
                getValue: (categoryValues: string[]) => {
                    let range = measureOptions.upperBound - measureOptions.lowerBound;
                    let val = randomNumber(range, measureOptions.lowerBound);
                    val = roundToPrecision(val, measureOptions.precision);
                    return val.toString();
                },
                name: "measure1",
            }
        ];
        
        let rowCount = _.reduce(categoryColumns, (total, c) => total * c.length, 1);
        console.log("generating " + rowCount + " rows...");
        
        let rows: string[][] = [];
        let valueIndices: number[] = new Array(categoryColumns.length);
        _.fill(valueIndices, 0);
        for (let r = 0; r < rowCount; r++) {
            // fill in row values
            let row: string[] = new Array(categoryColumns.length + measureColumns.length);
            
            // categories
            for (let c = 0; c < categoryColumns.length; c++) {
                let i = valueIndices[c];
                row[c] = categoryColumns[c].getValue(i);
            }
            
            // measures
            for (let c = 0; c < measureColumns.length; c++) {
                row[categoryColumns.length + c] = measureColumns[c].getValue(row.slice(0, categoryColumns.length));
            }
            
            // increment indices
            for (let i = categoryColumns.length - 1; i >= 0; i--) {
                valueIndices[i] = valueIndices[i] + 1;
                if (valueIndices[i] < categoryColumns[i].length)
                    break;
                else
                    valueIndices[i] = 0;
            }
            
            rows.push(row);
        }
        
        // add sparsity
        //addSparsity(table, measureOptions.sparsity);
        
        // add headers
        let headers: string[] = [];
        for (let c of categoryColumns)
            headers.push(c.name);
            
        for (let c of measureColumns)
            headers.push(c.name);

        rows.unshift(headers);
        
        // convert to strings & add headers
        let lines: string[] = [];
        for (let r = 0; r < rows.length; r++) {
          let row: string[] = rows[r];
          lines.push(toRowStr(row));
        }
        
        let content = lines.join('\r\n');
        
        fs.writeFile("data.csv", content);
    }
}

GenerateData.generateData();