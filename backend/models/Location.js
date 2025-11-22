import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['internal', 'supplier', 'customer', 'loss'], 
    default: 'internal',
    required: true
  },
  address: { 
    type: String, 
    default: '' 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Ensure a user cannot have two locations with the exact same name
LocationSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Location', LocationSchema);