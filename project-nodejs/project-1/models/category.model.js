const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        slug: "name"   // 👈 THÊM DÒNG NÀY ĐỂ TỰ ĐỘNG SINH SLUG TỪ name
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    position: {
        type: Number,
        default: 1,
        min: 0
    },
    image: {
        type: String,
        default: '/admin/image/no-image.png'
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    // ✅ THÊM CÁC FIELD CHO THÙNG RÁC
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// =============================================================
// VIRTUAL
// =============================================================
categorySchema.virtual('createdByInfo', {
    ref: 'User',
    localField: 'createdBy',
    foreignField: '_id',
    justOne: true
});

categorySchema.virtual('updatedByInfo', {
    ref: 'User',
    localField: 'updatedBy',
    foreignField: '_id',
    justOne: true
});

categorySchema.virtual('deletedByInfo', {
    ref: 'User',
    localField: 'deletedBy',
    foreignField: '_id',
    justOne: true
});

categorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

categorySchema.virtual('parentCategory', {
    ref: 'Category',
    localField: 'parent',
    foreignField: '_id',
    justOne: true
});

categorySchema.virtual('createdByName').get(function() {
    if (this.createdByInfo && this.createdByInfo.fullName) {
        return this.createdByInfo.fullName;
    }
    return this.createdBy ? 'Đang tải...' : 'N/A';
});

categorySchema.virtual('updatedByName').get(function() {
    if (this.updatedByInfo && this.updatedByInfo.fullName) {
        return this.updatedByInfo.fullName;
    }
    return this.updatedBy ? 'Đang tải...' : 'N/A';
});

categorySchema.virtual('deletedByName').get(function() {
    if (this.deletedByInfo && this.deletedByInfo.fullName) {
        return this.deletedByInfo.fullName;
    }
    return this.deletedBy ? 'Đang tải...' : 'N/A';
});

// =============================================================
// ✅ ĐÃ XÓA pre('save') - KHÔNG CÒN LỖI
// =============================================================

// =============================================================
// METHOD
// =============================================================
categorySchema.methods.getFullPath = async function() {
    let path = this.slug;
    let current = this;
    while (current.parent) {
        const parent = await mongoose.model('Category').findById(current.parent);
        if (!parent) break;
        path = parent.slug + '/' + path;
        current = parent;
    }
    return path;
};

categorySchema.methods.isChild = function() {
    return this.parent !== null && this.parent !== undefined;
};

categorySchema.methods.hasChildren = async function() {
    const count = await mongoose.model('Category').countDocuments({ parent: this._id });
    return count > 0;
};

// =============================================================
// STATIC
// =============================================================
categorySchema.statics.getTree = async function() {
    const categories = await this.find({ isDeleted: false })
        .sort({ position: 1, name: 1 })
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email');
    
    const buildTree = (items, parentId = null) => {
        return items
            .filter(item => {
                const itemParent = item.parent ? item.parent.toString() : null;
                const parent = parentId ? parentId.toString() : null;
                return itemParent === parent;
            })
            .map(item => {
                const obj = item.toObject();
                obj.createdByName = item.createdBy ? item.createdBy.fullName : 'N/A';
                obj.updatedByName = item.updatedBy ? item.updatedBy.fullName : 'N/A';
                obj.children = buildTree(items, item._id);
                return obj;
            });
    };
    return buildTree(categories);
};

categorySchema.statics.getActive = function() {
    return this.find({ status: 'active', isDeleted: false })
        .sort({ position: 1, name: 1 })
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email');
};

categorySchema.statics.search = function(keyword) {
    return this.find({
        name: { $regex: keyword, $options: 'i' },
        isDeleted: false
    })
    .sort({ position: 1, name: 1 })
    .populate('createdBy', 'fullName email')
    .populate('updatedBy', 'fullName email');
};

categorySchema.statics.getRootCategories = function() {
    return this.find({ parent: null, isDeleted: false })
        .sort({ position: 1, name: 1 })
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email');
};

categorySchema.statics.getChildren = function(parentId) {
    return this.find({ parent: parentId, isDeleted: false })
        .sort({ position: 1, name: 1 })
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email');
};

categorySchema.statics.countChildren = function(parentId) {
    return this.countDocuments({ parent: parentId, isDeleted: false });
};

// =============================================================
// TOJSON / TOOBJECT
// =============================================================
categorySchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        if (doc.populated('createdBy')) {
            ret.createdByName = doc.createdBy ? doc.createdBy.fullName : 'N/A';
        }
        if (doc.populated('updatedBy')) {
            ret.updatedByName = doc.updatedBy ? doc.updatedBy.fullName : 'N/A';
        }
        if (doc.populated('deletedBy')) {
            ret.deletedByName = doc.deletedBy ? doc.deletedBy.fullName : 'N/A';
        }
        return ret;
    }
});

categorySchema.set('toObject', {
    virtuals: true
});

module.exports = mongoose.model('Category', categorySchema);