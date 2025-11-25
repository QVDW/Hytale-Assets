import { NextResponse } from 'next/server';
import connectMongoDB from '../../../../../libs/mongodb';
import mongoose from 'mongoose';

const footerColumnSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  items: [{
    text: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: false,
    },
    isExternal: {
      type: Boolean,
      default: false,
    }
  }]
});

const defaultFooterSettings = {
  columns: [
    {
      title: "Legal",
      items: [
        { text: "Legal Disclaimer", link: "/legal/disclaimer" },
        { text: "Privacy Policy", link: "/legal/privacy" }
      ]
    },
    {
      title: "Title",
      items: [
        { text: "Item 1", link: "/" },
        { text: "Item 2", link: "/" },
        { text: "Item 3", link: "/" }
      ]
    },
    {
      title: "Title",
      items: [
        { text: "Item 1", link: "/" },
        { text: "Item 2", link: "/" },
        { text: "Item 3", link: "/" }
      ]
    },
    {
      title: "Title",
      items: [
        { text: "Item 1", link: "/" },
        { text: "Item 2", link: "/" },
        { text: "Item 3", link: "/" }
      ]
    }
  ],
  socialMedia: {
    youtube: "",
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: ""
  },
  contactInfo: {
    name: "",
    address: "",
    phone: "",
    email: ""
  },
  backgroundColor: "#202020",
  textColor: "#fefefe"
};

const socialMediaSchema = new mongoose.Schema({
  youtube: { type: String, default: "" },
  facebook: { type: String, default: "" },
  instagram: { type: String, default: "" },
  twitter: { type: String, default: "" },
  linkedin: { type: String, default: "" }
}, { _id: false });

const contactInfoSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" }
}, { _id: false });

const footerSchema = new mongoose.Schema({
  columns: {
    type: [footerColumnSchema],
    required: true,
    default: defaultFooterSettings.columns
  },
  socialMedia: {
    type: socialMediaSchema,
    required: true,
    default: defaultFooterSettings.socialMedia
  },
  contactInfo: {
    type: contactInfoSchema,
    required: true,
    default: defaultFooterSettings.contactInfo
  },
  backgroundColor: {
    type: String,
    default: defaultFooterSettings.backgroundColor,
  },
  textColor: {
    type: String,
    default: defaultFooterSettings.textColor,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const documentToPlainObject = (doc) => {
  if (!doc) return null;
  
  if (!doc.toObject) return doc;
  
  const plainObject = doc.toObject();
  
  if (plainObject._id) {
    plainObject._id = plainObject._id.toString();
  }
  
  if (!plainObject.socialMedia) {
    plainObject.socialMedia = defaultFooterSettings.socialMedia;
  }
  
  if (!plainObject.contactInfo) {
    plainObject.contactInfo = defaultFooterSettings.contactInfo;
  }
  
  return plainObject;
};

const resetModel = async () => {
  try {
    if (mongoose.models.Footer) {
      delete mongoose.models.Footer;
    }
    
    if (mongoose.connection.collections.footers) {
      await mongoose.connection.dropCollection('footers');
    }
  } catch (error) {
    console.error('Error resetting model:', error);
  }
};

let Footer;
try {
  Footer = mongoose.model("Footer");
} catch {
  Footer = mongoose.model("Footer", footerSchema);
}

const createDefaultFooterSettings = async () => {
  const newData = {
    ...defaultFooterSettings,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  const newSettings = await Footer.create(newData);
  
  if (!newSettings.socialMedia) {
    newSettings.socialMedia = defaultFooterSettings.socialMedia;
    newSettings.markModified('socialMedia');
    await newSettings.save();
  }
  
  if (!newSettings.contactInfo) {
    newSettings.contactInfo = defaultFooterSettings.contactInfo;
    newSettings.markModified('contactInfo');
    await newSettings.save();
  }
  
  return newSettings;
};

const findOneOrCreate = async () => {
  try {
    const footerSettings = await Footer.findOne({}).exec();
    if (footerSettings) {
      if (!footerSettings.socialMedia) {
        footerSettings.socialMedia = defaultFooterSettings.socialMedia;
        footerSettings.markModified('socialMedia');
        await footerSettings.save();
      }
      
      if (!footerSettings.contactInfo) {
        footerSettings.contactInfo = defaultFooterSettings.contactInfo;
        footerSettings.markModified('contactInfo');
        await footerSettings.save();
      }
      
      // Add LinkedIn if it doesn't exist
      if (!footerSettings.socialMedia.linkedin) {
        footerSettings.socialMedia.linkedin = "";
        footerSettings.markModified('socialMedia');
        await footerSettings.save();
      }
      
      return footerSettings;
    }
    
    return await createDefaultFooterSettings();
  } catch (error) {
    console.error('Error in findOneOrCreate:', error);
    throw error;
  }
};

export async function DELETE() {
  try {
    await connectMongoDB();
    
    await resetModel();
    
    await connectMongoDB();
    
    Footer = mongoose.model("Footer", footerSchema);
    
    const newSettings = await createDefaultFooterSettings();
    const plainSettings = documentToPlainObject(newSettings);
    
    return NextResponse.json({ 
      message: 'Footer settings reset successfully',
      settings: plainSettings 
    });
  } catch (error) {
    console.error('Error resetting footer settings:', error);
    return NextResponse.json(
      { message: 'Error resetting footer settings', error: error.toString() }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectMongoDB();
    
    const footerSettings = await findOneOrCreate();
    
    const responseObj = documentToPlainObject(footerSettings);
    
    return NextResponse.json(responseObj);
  } catch (error) {
    console.error('Error fetching footer settings:', error);
    return NextResponse.json(
      { message: 'Error fetching footer settings', error: error.toString() }, 
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const footerData = await req.json();
    
    await connectMongoDB();
    
    let footerSettings = await Footer.findOne({}).exec();
    
    if (footerSettings) {
      
      const socialMedia = {
        youtube: footerData.socialMedia?.youtube || "",
        facebook: footerData.socialMedia?.facebook || "",
        instagram: footerData.socialMedia?.instagram || "",
        twitter: footerData.socialMedia?.twitter || "",
        linkedin: footerData.socialMedia?.linkedin || ""
      };
      
      const contactInfo = {
        name: footerData.contactInfo?.name || "",
        address: footerData.contactInfo?.address || "",
        phone: footerData.contactInfo?.phone || "",
        email: footerData.contactInfo?.email || ""
      };
      
      footerSettings.columns = footerData.columns || [];
      footerSettings.socialMedia = socialMedia;
      footerSettings.contactInfo = contactInfo;
      footerSettings.backgroundColor = footerData.backgroundColor || "#202020";
      footerSettings.textColor = footerData.textColor || "#fefefe";
      footerSettings.updated_at = new Date();
      
      footerSettings.markModified('socialMedia');
      footerSettings.markModified('contactInfo');
      footerSettings.markModified('columns');
      
      await footerSettings.save();
      
      const verifySettings = await Footer.findOne({}).exec();
      const plainVerify = documentToPlainObject(verifySettings);
      
      return NextResponse.json({ 
        message: 'Footer settings updated successfully',
        settings: plainVerify
      });
    } else {
      const socialMedia = {
        youtube: footerData.socialMedia?.youtube || "",
        facebook: footerData.socialMedia?.facebook || "",
        instagram: footerData.socialMedia?.instagram || "",
        twitter: footerData.socialMedia?.twitter || "",
        linkedin: footerData.socialMedia?.linkedin || ""
      };
      
      const contactInfo = {
        name: footerData.contactInfo?.name || "",
        address: footerData.contactInfo?.address || "",
        phone: footerData.contactInfo?.phone || "",
        email: footerData.contactInfo?.email || ""
      };
      
      const newSettings = {
        columns: footerData.columns || [],
        socialMedia: socialMedia,
        contactInfo: contactInfo,
        backgroundColor: footerData.backgroundColor || "#202020",
        textColor: footerData.textColor || "#fefefe"
      };
      
      const created = await Footer.create(newSettings);
      
      const plainCreated = documentToPlainObject(created);
      
      return NextResponse.json({ 
        message: 'Footer settings created successfully',
        settings: plainCreated
      });
    }
  } catch (error) {
    console.error('Error updating footer settings:', error);
    return NextResponse.json(
      { 
        message: 'Error updating footer settings', 
        error: error.toString(),
        stack: error.stack 
      }, 
      { status: 500 }
    );
  }
} 