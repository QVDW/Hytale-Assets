import { NextResponse } from "next/server";
import prisma from "../../../../../libs/database";
import { getCurrentUser } from "../../../../../src/utils/authMiddleware";

// Get all categories (for admin)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (id) {
            // Get single category
            const category = await prisma.category.findUnique({
                where: { category_id: id },
                include: {
                    parent: {
                        select: {
                            category_id: true,
                            name: true
                        }
                    },
                    children: {
                        select: {
                            category_id: true,
                            name: true
                        }
                    }
                }
            });

            if (!category) {
                return NextResponse.json(
                    { error: "Category not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(category);
        }

        // Get all categories
        const categories = await prisma.category.findMany({
            orderBy: [
                { sort_order: 'asc' },
                { name: 'asc' }
            ],
            include: {
                parent: {
                    select: {
                        category_id: true,
                        name: true
                    }
                },
                children: {
                    select: {
                        category_id: true,
                        name: true
                    }
                }
            }
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// Create a new category
export async function POST(request) {
    try {
        // Check authentication
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { name, description, parent_category_id, sort_order, icon_url } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // Check if parent category exists (if provided)
        if (parent_category_id) {
            const parent = await prisma.category.findUnique({
                where: { category_id: parent_category_id }
            });

            if (!parent) {
                return NextResponse.json(
                    { error: "Parent category not found" },
                    { status: 400 }
                );
            }
        }

        const category = await prisma.category.create({
            data: {
                name,
                description: description || null,
                parent_category_id: parent_category_id || null,
                sort_order: sort_order || 0,
                icon_url: icon_url || null
            }
        });

        return NextResponse.json(
            { message: "Category created successfully", category },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating category:", error);
        
        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}

// Update a category
export async function PUT(request) {
    try {
        // Check authentication
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        const { name, description, parent_category_id, sort_order, icon_url } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { category_id: id }
        });

        if (!existingCategory) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // Prevent circular references (category cannot be its own parent)
        if (parent_category_id === id) {
            return NextResponse.json(
                { error: "A category cannot be its own parent" },
                { status: 400 }
            );
        }

        // Check if parent category exists (if provided)
        if (parent_category_id) {
            const parent = await prisma.category.findUnique({
                where: { category_id: parent_category_id }
            });

            if (!parent) {
                return NextResponse.json(
                    { error: "Parent category not found" },
                    { status: 400 }
                );
            }
        }

        const category = await prisma.category.update({
            where: { category_id: id },
            data: {
                name,
                description: description || null,
                parent_category_id: parent_category_id || null,
                sort_order: sort_order !== undefined ? sort_order : existingCategory.sort_order,
                icon_url: icon_url !== undefined ? icon_url : existingCategory.icon_url
            }
        });

        return NextResponse.json(
            { message: "Category updated successfully", category }
        );
    } catch (error) {
        console.error("Error updating category:", error);
        
        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

// Delete a category
export async function DELETE(request) {
    try {
        // Check authentication
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { category_id: id },
            include: {
                children: true,
                assets: {
                    select: {
                        asset_id: true
                    }
                }
            }
        });

        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // Check if category has children
        if (category.children && category.children.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete category with subcategories. Please delete or move subcategories first." },
                { status: 400 }
            );
        }

        // Check if category has assets
        if (category.assets && category.assets.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete category with assets. Please remove or reassign assets first." },
                { status: 400 }
            );
        }

        await prisma.category.delete({
            where: { category_id: id }
        });

        return NextResponse.json(
            { message: "Category deleted successfully" }
        );
    } catch (error) {
        console.error("Error deleting category:", error);
        
        // Handle foreign key constraint violation
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: "Cannot delete category: it is referenced by other records" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}

