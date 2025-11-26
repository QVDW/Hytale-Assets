"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../../../components/Navbar";
import "../../styles/auth.scss";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        profile_picture: "/pfp/1.png"
    });
    const [availablePictures, setAvailablePictures] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Load available profile pictures
    useEffect(() => {
        const fetchProfilePictures = async () => {
            try {
                const response = await fetch("/api/user-auth/profile-pictures");
                const data = await response.json();
                
                if (data.pictures && data.pictures.length > 0) {
                    setAvailablePictures(data.pictures);
                    // Set the first picture as default
                    setFormData(prev => {
                        // Only update if still using the default
                        if (prev.profile_picture === "/pfp/1.png" || !prev.profile_picture) {
                            return {
                                ...prev,
                                profile_picture: data.pictures[0]
                            };
                        }
                        return prev;
                    });
                } else {
                    // Fallback to default if API fails
                    setAvailablePictures(["/pfp/1.png"]);
                }
            } catch (error) {
                console.error("Error fetching profile pictures:", error);
                // Fallback to default if API fails
                setAvailablePictures(["/pfp/1.png"]);
            }
        };

        fetchProfilePictures();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError("");
    };

    const handleProfilePictureSelect = (picture: string) => {
        setFormData(prev => ({
            ...prev,
            profile_picture: picture
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/user-auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    profile_picture: formData.profile_picture
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed");
                setLoading(false);
                return;
            }

            // Redirect to login page
            router.push("/login?registered=true");
        } catch (err) {
            setError("An error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Create Your Account</h1>
                        <p className="auth-subtitle">Join the magical realm</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="Choose a username"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="your.email@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="At least 6 characters"
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Confirm your password"
                            />
                        </div>

                        <div className="form-group">
                            <label>Choose Profile Picture</label>
                            <div className="profile-picture-selector">
                                {availablePictures.map((picture) => (
                                    <div
                                        key={picture}
                                        className={`profile-picture-option ${
                                            formData.profile_picture === picture ? "selected" : ""
                                        }`}
                                        onClick={() => handleProfilePictureSelect(picture)}
                                    >
                                        <Image
                                            src={picture}
                                            alt="Profile picture"
                                            width={80}
                                            height={80}
                                            className="profile-picture-preview"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{" "}
                            <Link href="/login" className="auth-link">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

