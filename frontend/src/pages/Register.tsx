import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token, data.user);
                navigate('/');
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md p-8 bg-white/5 rounded-2xl border border-white/10">
                <h2 className="text-2xl font-bold mb-6 text-center">Join PEGASUS</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg focus:outline-none focus:border-white" required />
                    </div>
                    <button type="submit" className="w-full py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors">Register</button>
                </form>
            </div>
        </div>
    );
};
export default Register;
