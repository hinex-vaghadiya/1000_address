const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, trim: true, default: '' },
    std: { type: String, trim: true, default: '' },
    school: { type: String, trim: true, default: '' },
    board: { type: String, trim: true, default: '' },
    m_mob_no: { type: String, trim: true, default: '' },
    f_mob_no: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    area: { type: String, trim: true, default: '' },
    reference: { type: String, trim: true, default: '' },
    added_by: { type: String, trim: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
