const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
    {
        data : {
            type : Array
        }
    },{
        timestamps : true,
    }

);

module.exports=(conn)=> conn.model('PressurePoints',pointSchema);
