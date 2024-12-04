// import node module libraries
import { Fragment } from 'react';
import { Col, Row, Card, Form, Button, Image } from 'react-bootstrap';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

// import widget/custom components
import { GeeksSEO } from 'widgets';

// import authlayout to override default layout 
import AuthLayout from 'layouts/dashboard/AuthLayout';

const SignUp = () => {
	const router = useRouter();
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		agreeToTerms: false
	});
	const [isLoading, setIsLoading] = useState(false);

	const handleChange = (e) => {
		const { id, value, checked } = e.target;
		setFormData(prev => ({
			...prev,
			[id]: id === 'agreeToTerms' ? checked : value
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!formData.agreeToTerms) {
			toast.error('Please agree to the Terms of Service and Privacy Policy');
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: formData.email,
					password: formData.password,
					username: formData.username
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to create account');
			}

			toast.success('Account created successfully! Redirecting to login...');
			
			// Redirect to sign-in page after successful registration
			setTimeout(() => {
				router.push('/authentication/sign-in');
			}, 2000);

		} catch (error) {
			toast.error(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Fragment>
			{/* Geeks SEO settings  */}
			<GeeksSEO title="Sign Up | Geeks Nextjs Template" />

			<Row className="align-items-center justify-content-center g-0 min-vh-100">
				<Col lg={5} md={5} className="py-8 py-xl-0">
					<Card>
						<Card.Body className="p-6">
							<div className="mb-4">
								<Link href="/">
									<Image src="/images/brand/logo/logo-icon.svg" className="mb-4" alt="" />
								</Link>
								<h1 className="mb-1 fw-bold">Sign up</h1>
								<span>
									Already have an account?{' '}
									<Link href="/sign-in" className="ms-1">
										Sign in
									</Link>
								</span>
							</div>
							{/* Form */}
							<Form onSubmit={handleSubmit}>
								<Row>
									<Col lg={12} md={12} className="mb-3">
										{/* User Name */}
										<Form.Label>User Name</Form.Label>
										<Form.Control
											type="text"
											id="username"
											placeholder="User Name"
											required
											value={formData.username}
											onChange={handleChange}
										/>
									</Col>
									<Col lg={12} md={12} className="mb-3">
										{/* email */}
										<Form.Label>Email </Form.Label>
										<Form.Control
											type="email"
											id="email"
											placeholder="Email address here"
											required
											value={formData.email}
											onChange={handleChange}
										/>
									</Col>
									<Col lg={12} md={12} className="mb-3">
										{/* Password */}
										<Form.Label>Password </Form.Label>
										<Form.Control
											type="password"
											id="password"
											placeholder="**************"
											required
											value={formData.password}
											onChange={handleChange}
										/>
									</Col>
									<Col lg={12} md={12} className="mb-3">
										{/* Checkbox */}
										<Form.Check type="checkbox" id="agreeToTerms">
											<Form.Check.Input
												type="checkbox"
												id="agreeToTerms"
												checked={formData.agreeToTerms}
												onChange={handleChange}
											/>
											<Form.Check.Label>
												I agree to the{' '}
												<Link href="/marketing/specialty/terms-and-conditions/">
													Terms of Service
												</Link>{' '}
												and{' '}
												<Link href="/marketing/specialty/terms-and-conditions/">
													Privacy Policy.
												</Link>
											</Form.Check.Label>
										</Form.Check>
									</Col>
									<Col lg={12} md={12} className="mb-0 d-grid gap-2">
										{/* Button */}
										<Button variant="primary" type="submit" disabled={isLoading}>
											{isLoading ? 'Creating Account...' : 'Sign Up'}
										</Button>
									</Col>
								</Row>
							</Form>
							<hr className="my-4" />
							<div className="mt-4 text-center">
								{/* Facebook */}
								<Link href="#" className="btn-social btn-social-outline btn-facebook">
									<i className="fab fa-facebook"></i>
								</Link>{' '}
								{/* Twitter */}
								<Link href="#" className="btn-social btn-social-outline btn-twitter">
									<i className="fab fa-twitter"></i>
								</Link>{' '}
								{/* LinkedIn */}
								<Link href="#" className="btn-social btn-social-outline btn-linkedin">
									<i className="fab fa-linkedin"></i>
								</Link>{' '}
								{/* GitHub */}
								<Link href="#" className="btn-social btn-social-outline btn-github">
									<i className="fab fa-github"></i>
								</Link>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Fragment>
	);
};

SignUp.Layout = AuthLayout;

export default SignUp;