import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";

export async function GET(request) {
    try {
        // Fetch all categories
        const categories = await prisma.category.findMany({
            orderBy: [
                { sort_order: 'asc' },
                { name: 'asc' }
            ],
            include: {
                children: {
                    orderBy: [
                        { sort_order: 'asc' },
                        { name: 'asc' }
                    ]
                }
            }
        });

        // Organize into hierarchical structure
        // Parent categories (no parent_category_id)
        const parentCategories = categories.filter(cat => !cat.parent_category_id);
        
        // Build hierarchical structure
        const hierarchicalCategories = parentCategories.map(parent => ({
            ...parent,
            children: categories.filter(cat => cat.parent_category_id === parent.category_id)
        }));

        return NextResponse.json({
            categories: hierarchicalCategories,
            allCategories: categories // Also return flat list for easy lookup
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

