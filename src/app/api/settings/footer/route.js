import { NextResponse } from 'next/server';
import prisma from '../../../../../libs/database';

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

const findOneOrCreate = async () => {
  try {
    let footerSettings = await prisma.footer.findFirst();
    
    if (!footerSettings) {
      footerSettings = await prisma.footer.create({
        data: defaultFooterSettings
      });
    }
    
    // Ensure all fields exist
    const socialMedia = footerSettings.socialMedia || defaultFooterSettings.socialMedia;
    const contactInfo = footerSettings.contactInfo || defaultFooterSettings.contactInfo;
    const columns = footerSettings.columns || defaultFooterSettings.columns;
    
    // Ensure LinkedIn exists
    if (!socialMedia.linkedin) {
      socialMedia.linkedin = "";
    }
    
    return {
      ...footerSettings,
      socialMedia,
      contactInfo,
      columns
    };
  } catch (error) {
    console.error('Error in findOneOrCreate:', error);
    throw error;
  }
};

export async function DELETE() {
  try {
    // Delete all footer settings
    await prisma.footer.deleteMany();
    
    // Create default settings
    const newSettings = await prisma.footer.create({
      data: defaultFooterSettings
    });
    
    return NextResponse.json({ 
      message: 'Footer settings reset successfully',
      settings: newSettings 
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
    const footerSettings = await findOneOrCreate();
    return NextResponse.json(footerSettings);
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
    
    let footerSettings = await prisma.footer.findFirst();
    
    if (footerSettings) {
      const updated = await prisma.footer.update({
        where: { id: footerSettings.id },
        data: {
          columns: footerData.columns || [],
          socialMedia,
          contactInfo,
          backgroundColor: footerData.backgroundColor || "#202020",
          textColor: footerData.textColor || "#fefefe"
        }
      });
      
      return NextResponse.json({ 
        message: 'Footer settings updated successfully',
        settings: updated
      });
    } else {
      const created = await prisma.footer.create({
        data: {
          columns: footerData.columns || [],
          socialMedia,
          contactInfo,
          backgroundColor: footerData.backgroundColor || "#202020",
          textColor: footerData.textColor || "#fefefe"
        }
      });
      
      return NextResponse.json({ 
        message: 'Footer settings created successfully',
        settings: created
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
