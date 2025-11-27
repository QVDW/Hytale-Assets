import { NextResponse } from "next/server";
import prisma from "../../../../../../libs/database";

export async function GET(request, { params }) {
    try {
        const { asset_id } = await params;

        if (!asset_id) {
            return NextResponse.json(
                { error: "Asset ID is required" },
                { status: 400 }
            );
        }

        // Verify asset exists
        const asset = await prisma.asset.findUnique({
            where: {
                asset_id: asset_id
            },
            select: {
                asset_id: true
            }
        });

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Fetch all versions for the asset
        const versions = await prisma.assetVersion.findMany({
            where: {
                asset_id: asset_id
            },
            orderBy: {
                upload_date: "desc"
            }
        });

        return NextResponse.json({
            versions: versions
        });

    } catch (error) {
        console.error("Error fetching asset versions:", error);
        return NextResponse.json(
            { error: "Failed to fetch asset versions" },
            { status: 500 }
        );
    }
}

