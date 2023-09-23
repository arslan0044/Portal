function keyval(key, val, obj) {
    var obj = obj || {};
    obj[key] = val;
    return obj;
}

class Row extends React.Component {
    state = {
        name: this.props.value.name,
        balanced:
            ~~this.props.value.assets - ~~this.props.value.liabilities ===
            ~~this.props.value.equity,
        assets: this.props.value.assets / mult,
        liabilities: this.props.value.liabilities / mult,
        equity: this.props.value.equity / mult,
    };

    reset = () => {
        this.setState({
            name: "",
            balanced: true,
            assets: 0,
            liabilities: 0,
            equity: 0,
        });
    };

    constructor(props) {
        super(...arguments);
        console.log(
            props.value.assets,
            props.value.liabilities,
            props.value.equity
        );
        props.reset(props.value.id, this.reset);
    }

    onChange = (e, col) => {
        var val = e.target.value;
        var obj = {
            balanced: this.props.updateRow(this.props.value.id, col, val),
        };
        this.setState(keyval(col, val, obj));
    };

    render() {
        var color = this.state.balanced ? "#FFF" : "rgba(255,0,0,0.4)";
        return (
            <tr>
                <td>
                    <input
                        className="p-1"
                        style={{ background: color }}
                        onChange={(e) => this.onChange(e, "name")}
                        value={this.state.name}
                        placeholder="Mortgage, Credit Card Debt, Cash, Stocks, etc"
                    />
                </td>
                <td>
                    <input
                        className="p-1"
                        style={{ background: color }}
                        onChange={(e) => this.onChange(e, "assets")}
                        value={this.state.assets}
                    />
                </td>
                <td>
                    <input
                        className="p-1"
                        style={{ background: color }}
                        onChange={(e) => this.onChange(e, "liabilities")}
                        value={this.state.liabilities}
                    />
                </td>
                <td>
                    <input
                        className="p-1"
                        style={{ background: color }}
                        onChange={(e) => this.onChange(e, "equity")}
                        value={this.state.equity}
                    />
                </td>
                <td>
                    <button
                        className="p-1 btn btn-danger"
                        onClick={() => this.props.deleteRow(this.props.value.id)}
                    >
                        &#10006;
                    </button>
                </td>
            </tr>
        );
    }
}

var mult = 1e4; //4 decimal point precision. numbers are multiplied to avoid floating point errors.
var id_ = 0;

function defaultRow() {
    id_++;
    return {
        id: id_,
        name: "",
        assets: 0,
        liabilities: 0,
        equity: 0,
    };
}
class Table extends React.Component {
    state = {
        rows: [defaultRow()],
        totals: {
            assets: 0,
            liabilities: 0,
            equity: 0,
        },
    };

    addUp = () => {
        var totals = {
            assets: 0,
            liabilities: 0,
            equity: 0,
        };
        this.state.rows.forEach(function (row) {
            for (var z in totals) {
                totals[z] += row[z];
            }
        });

        this.setState({ totals: totals });
    };

    updateRow = (id, col, value) => {
        var ret = Math.floor(value * mult);
        if (col === "name") ret = value;
        var balanced = false;

        this.state.rows.forEach((row, i) => {
            if (row.id !== id) return;
            row[col] = ret;
            balanced = row["assets"] - row["liabilities"] === row["equity"];
        });

        this.addUp();
        return balanced;
    };

    addRow = (custom, row) => {
        if (custom) {
            id_++;
            row.id = id_;
        }
        var a = custom === true ? row : defaultRow();
        this.state.rows.push(a);
        this.setState({ rows: this.state.rows });
    };

    deleteRow = (id) => {
        if (this.state.rows.length === 1) {
            this.state.rows[0].reset();
            return;
        }
        rows = this.state.rows.filter((c) => c.id !== id);
        this.setState({ rows });
    };

    importCSV = (data) => {
        $("#fi").val("");
        var csv = Papa.parse(data).data;
        var cols = [];
        this.setState({ rows: [] });
        csv.forEach((row, i) => {
            if (i === 0) {
                cols = row;
                return;
            }

            var row_ = {
                name: "",
                assets: "",
                liabilities: "",
                equity: "",
            };

            row.forEach((val, z) => {
                var col = cols[z].toLowerCase();
                row_[col] = col === "name" ? val : val * mult;
            });

            if (row_["name"] !== "Totals") this.addRow(true, row_);
        });

        this.addUp();
    };

    example = () => {
        $.get(
            "https://storage.googleapis.com/x13machine/react-accounting.csv",
            this.importCSV
        );
    };

    import = () => {
        $("#fiBackground").css("display", "block");
    };

    export = () => {
        var rows = this.state.rows;
        var out = [];
        rows.forEach((row) => {
            out.push({
                Name: row.name,
                Assets: row.assets / mult,
                Liabilities: row.liabilities / mult,
                Equity: row.equity / mult,
            });
        });

        var totals = this.state.totals;
        out.push({
            Name: "Totals",
            Assets: totals.assets / mult,
            Liabilities: totals.liabilities / mult,
            Equity: totals.equity / mult,
        });

        var blob = new Blob([Papa.unparse(out)], {
            type: "text/csv;charset=utf-8",
        });
        saveAs(blob, "export.csv");
    };

    reset = () => {
        this.state.rows[0].reset();
        this.setState({
            rows: [this.state.rows[0]],
            totals: {
                assets: 0,
                liabilities: 0,
                equity: 0,
            },
        });
    };

    setRowReset = (id, rowReset) => {
        this.state.rows.forEach((row, i) => {
            if (row.id !== id) return;
            row.reset = rowReset;
        });
    };

    constructor(props) {
        super(...arguments);
        $("#fi").change((event) => {
            var input = event.target;
            var reader = new FileReader();
            reader.onload = (e) => {
                this.importCSV(e.target.result);
            };
            reader.readAsText(input.files[0]);
        });
    }

    render() {
        return (
            <React.Fragment>
                <p>
                    This is a simple accounting app I made to learn react.js. It
                    automatically checks whether each row balances out. You can import and
                    export CSV files.
                </p>
                <button onClick={this.import} className="m-1 fa fa-upload btn">
                    {" "}
                    Import
                </button>
                <button onClick={this.export} className="m-1 fa fa-download btn">
                    {" "}
                    Export
                </button>
                <button onClick={this.example} className="m-1 fa fa-book btn">
                    {" "}
                    Example
                </button>
                <button onClick={this.reset} className="m-1 fa fa-refresh btn">
                    {" "}
                    Reset
                </button>
                <table>
                    <tr>
                        <th>Name</th>
                        <th>Assets</th>
                        <th>Liabilities</th>
                        <th>Equity</th>
                    </tr>
                    {this.state.rows.map((row) => (
                        <Row
                            key={row.key}
                            deleteRow={this.deleteRow}
                            reset={this.setRowReset}
                            updateRow={this.updateRow}
                            value={row}
                        />
                    ))}

                    <tr>
                        <th>Totals</th>
                        <th>{this.state.totals.assets / mult}</th>
                        <th>{this.state.totals.liabilities / mult}</th>
                        <th>{this.state.totals.equity / mult}</th>
                    </tr>
                </table>
                <button onClick={() => this.addRow(false)} className="fa fa-plus btn">
                    {" "}
                    Add Row
                </button>
            </React.Fragment>
        );
    }
}

ReactDOM.render(<Table />, document.getElementById("root"));

$("#fiBackground").click(function () {
    $(this).css("display", "none");
});
