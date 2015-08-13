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
    
    function formattedRandomNumber(upperBound: number, lowerBound: number, precision: number): string {
        let range = upperBound - lowerBound;
        let val = randomNumber(range, lowerBound);
        val = roundToPrecision(val, precision);
        return val.toString();
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
    
    function createAllCombinations(categoryColumns: CategoryColumn[], measureColumns: MeasureColumn[], path: string) {
        let rowCount = _.reduce(categoryColumns, (total, c) => total * c.length, 1);
        console.log("generating " + rowCount + " rows...");
        
        let rows: string[] = [];
        
        // add headers
        let headers: string[] = [];
        for (let c of categoryColumns)
            headers.push(c.name);
            
        for (let c of measureColumns)
            headers.push(c.name);

        rows.unshift(toRowStr(headers));
        
        try {
            fs.unlinkSync(path);
        }
        catch (e) { }
        
        let valueIndices: number[] = new Array(categoryColumns.length);
        _.fill(valueIndices, 0);
        for (let r = 0; r < rowCount; r++) {
            // fill in row values
            let row: string[] = new Array(categoryColumns.length + measureColumns.length);
            
            // categories
            for (let c = 0; c < categoryColumns.length; c++) {
                let i = valueIndices[c];
                row[c] = categoryColumns[c].values[i];
            }
            
            // measures
            for (let c = 0; c < measureColumns.length; c++) {
                row[categoryColumns.length + c] = measureColumns[c].getValue();
            }
            
            // increment indices
            for (let i = categoryColumns.length - 1; i >= 0; i--) {
                valueIndices[i] = valueIndices[i] + 1;
                if (valueIndices[i] < categoryColumns[i].length)
                    break;
                else
                    valueIndices[i] = 0;
            }
            
            rows.push(toRowStr(row));
            
            if (r % 10000 === 0) {
                console.log(r + "/" + rowCount);
                fs.appendFileSync(path, rows.join('\r\n') + '\r\n');
                rows = [];
            }
        }
        
        if (rows.length > 0) {
            fs.appendFileSync(path, rows.join('\r\n') + '\r\n');
        }
    }
    
    function createRowsWithBlanks(primary: CategoryColumn, secondaries: CategoryColumn[], measures: MeasureColumn[], path: string) {
        //let secondaryLength = _.max(_.map(secondaries, (s) => s.length));
        let rowCount = primary.length * _.sum(_.map(secondaries, (s) => s.length));
        let rows: string[] = [];
        
        let categoryColumns = [primary].concat(secondaries);
        
        let primaryIndex = 0;
        let secondaryIndex = 0;
        let secondaryColumnIndex = 0;
        let secondaryColumn = secondaries[secondaryColumnIndex];
        
        console.log("generating " + rowCount + " rows...");
        
        // add headers
        let headers: string[] = [];
        for (let c of categoryColumns)
            headers.push(c.name);
            
        for (let c of measures)
            headers.push(c.name);

        rows.unshift(toRowStr(headers));
        
        for (let r = 0; r < rowCount; r++) {
            let row = new Array(categoryColumns.length + measures.length);
            
            // primary
            row[0] = primary.values[primaryIndex];
            
            // secondaries
            // for (let c = 0; c < secondaries.length; c++) {
            //     let value: string;
            //     if (secondaryIndex === c) {
            //         let secondary = secondaries[c];
            //         value = secondary.values[secondaryIndex];
            //     }
            //     else {
            //         value = "";
            //     }
            //     row[c + 1] = value;
            // }
            row[secondaryColumnIndex + 1] = secondaryColumn.values[secondaryIndex];
            
            // measures
            for (let c = 0; c < measures.length; c++) {
                row[categoryColumns.length + c] = measures[c].getValue();
            }
            
            rows.push(toRowStr(row));
            
            if (r % 10000 === 0) {
                console.log(r + "/" + rowCount);
                fs.appendFileSync(path, rows.join('\r\n') + '\r\n');
                rows = [];
            }
            
            // increment indices
            secondaryIndex++;
            if (secondaryIndex >= secondaryColumn.length) {
                secondaryIndex = 0;
                primaryIndex++;
            }
            
            if (primaryIndex >= primary.length) {
                primaryIndex = 0;
                secondaryColumnIndex++;
                secondaryColumn = secondaries[secondaryColumnIndex];
            }
        }
        
        if (rows.length > 0) {
            fs.appendFileSync(path, rows.join('\r\n') + '\r\n');
        }
    }
    
    interface CategoryColumn {
        length: number;
        values: string[];
        name: string;
    }
    
    interface MeasureColumn {
        getValue: () => string;
        name: string;
    }
    
    export function generateData() {
        let path = 'data.csv';
        
        let primaryColumn: CategoryColumn = {
            length: 20,
            values: _.map(_.range(20), (i: number) => "column1_" + i),
            name: "column1",
        };
        
        let secondaryColumns: CategoryColumn[] = [];
        for (let n = 2; n < 5; n++) {
            var name = "column" + n;
            secondaryColumns.push({
                length: 100,
                values: _.map(_.range(100), (i: number) => name + "_" + i),
                name: name,
            });
        }
        
        let measureOptions: MeasureValueOptions = {
            sparsity: 0.10,
            isScalar: false,
            lowerBound: -100,
            upperBound: 100,
            precision: 0.001,
        };
        
        let measureColumns: MeasureColumn[] = [
            {
                getValue: () => formattedRandomNumber(measureOptions.upperBound, measureOptions.lowerBound, measureOptions.precision),
                name: "measure1",
            }
        ];
        
        try {
            fs.unlinkSync(path);
        }
        catch (e) { }
        
        for (let i = 0; i < secondaryColumns.length; i++) {
            let p = 'data' + i + '.csv';
            createAllCombinations([primaryColumn, secondaryColumns[i]], measureColumns, p);
        }
        
        //createAllCombinations([primaryColumn].concat(secondaryColumns), measureColumns, path);
        
        // add sparsity
        //addSparsity(table, measureOptions.sparsity);
        
        // convert to strings & add headers
        // let lines: string[] = [];
        // for (let r = 0; r < rows.length; r++) {
        //   let row: string[] = rows[r];
        //   lines.push(toRowStr(row));
        // }
        // 
        // let content = lines.join('\r\n');
        // 
        // fs.writeFile("data.csv", content);
    }
}

GenerateData.generateData();