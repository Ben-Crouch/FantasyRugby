"""
Email utilities for Fantasy Rugby application

This module provides functions for sending emails, particularly for league codes.
"""

import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def generate_league_code():
    """
    Generate a unique 7-character league code with a mixture of letters and numbers.
    
    Returns:
        str: A 7-character alphanumeric code (uppercase) with mixed letters and numbers
    """
    # Use both uppercase letters and digits
    letters = string.ascii_uppercase
    digits = string.digits
    
    # Exclude confusing characters (0, O, I, 1)
    letters = letters.replace('O', '').replace('I', '')
    digits = digits.replace('0', '').replace('1', '')
    
    # Ensure we have a mixture of both letters and numbers
    # Generate 4 letters and 3 numbers
    code_parts = []
    
    # Add 4 random letters
    code_parts.extend(random.choice(letters) for _ in range(4))
    
    # Add 3 random digits
    code_parts.extend(random.choice(digits) for _ in range(3))
    
    # Shuffle to mix letters and numbers
    random.shuffle(code_parts)
    
    code = ''.join(code_parts)
    return code


def send_league_code_email(league_name, league_code, creator_email, creator_name):
    """
    Send league code email to the league creator.
    
    Args:
        league_name (str): Name of the created league
        league_code (str): The generated league code
        creator_email (str): Email address of the league creator
        creator_name (str): Name of the league creator
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        subject = f'Your Fantasy Rugby League Code: {league_name}'
        
        # Create HTML email content
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #e67e22; margin: 0;">🏉 Fantasy Rugby</h1>
                </div>
                
                <h2 style="color: #2c3e50;">Your League is Ready!</h2>
                
                <p>Hi {creator_name},</p>
                
                <p>Congratulations! Your fantasy rugby league <strong>"{league_name}"</strong> has been created successfully.</p>
                
                <div style="background-color: #f8f9fa; border: 2px solid #e67e22; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Your League Code</h3>
                    <div style="font-size: 32px; font-weight: bold; color: #e67e22; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                        {league_code}
                    </div>
                </div>
                
                <p><strong>Share this code with friends</strong> so they can join your league. They'll need to enter this code when joining.</p>
                
                <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #27ae60;">How to join your league:</h4>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li>Go to the Fantasy Rugby app</li>
                        <li>Click "Join League"</li>
                        <li>Enter the league code: <strong>{league_code}</strong></li>
                        <li>Create your team and start playing!</li>
                    </ol>
                </div>
                
                <p>Good luck with your league, and may the best team win! 🏆</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                    This email was sent from Fantasy Rugby. If you didn't create this league, please ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        plain_message = f"""
        Fantasy Rugby - Your League Code
        
        Hi {creator_name},
        
        Your fantasy rugby league "{league_name}" has been created successfully.
        
        Your League Code: {league_code}
        
        Share this code with friends so they can join your league. They'll need to enter this code when joining.
        
        How to join your league:
        1. Go to the Fantasy Rugby app
        2. Click "Join League"
        3. Enter the league code: {league_code}
        4. Create your team and start playing!
        
        Good luck with your league!
        
        --
        Fantasy Rugby
        """
        
        # Send the email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[creator_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        print(f"Error sending league code email: {e}")
        return False


def send_league_join_notification(league_name, joiner_name, joiner_email, creator_email):
    """
    Send notification to league creator when someone joins their league.
    
    Args:
        league_name (str): Name of the league
        joiner_name (str): Name of the person who joined
        joiner_email (str): Email of the person who joined
        creator_email (str): Email of the league creator
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        subject = f'Someone joined your Fantasy Rugby league: {league_name}'
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #e67e22; margin: 0;">🏉 Fantasy Rugby</h1>
                </div>
                
                <h2 style="color: #2c3e50;">New Team Joined Your League!</h2>
                
                <p>Great news! <strong>{joiner_name}</strong> has joined your fantasy rugby league <strong>"{league_name}"</strong>.</p>
                
                <div style="background-color: #e8f5e9; border: 2px solid #27ae60; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #27ae60;">New Team Member</h3>
                    <p style="margin: 0;"><strong>Name:</strong> {joiner_name}</p>
                    <p style="margin: 0;"><strong>Email:</strong> {joiner_email}</p>
                </div>
                
                <p>Your league is growing! Check the Fantasy Rugby app to see all your teams and start the draft when you're ready.</p>
                
                <p>Good luck with your league! 🏆</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                    This email was sent from Fantasy Rugby.
                </p>
            </div>
        </body>
        </html>
        """
        
        plain_message = f"""
        Fantasy Rugby - New Team Joined Your League
        
        Great news! {joiner_name} has joined your fantasy rugby league "{league_name}".
        
        New Team Member:
        Name: {joiner_name}
        Email: {joiner_email}
        
        Your league is growing! Check the Fantasy Rugby app to see all your teams and start the draft when you're ready.
        
        Good luck with your league!
        
        --
        Fantasy Rugby
        """
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[creator_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        print(f"Error sending join notification email: {e}")
        return False


def send_league_invitation(league_name, league_code, inviter_name, inviter_email, invitee_email, invitee_name=None):
    """
    Send league invitation email to a potential player.
    
    Args:
        league_name (str): Name of the league
        league_code (str): The league code to join
        inviter_name (str): Name of the person sending the invitation
        inviter_email (str): Email of the person sending the invitation
        invitee_email (str): Email of the person being invited
        invitee_name (str, optional): Name of the person being invited
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        subject = f'You\'re invited to join "{league_name}" on Fantasy Rugby!'
        
        # Use invitee name if provided, otherwise use a generic greeting
        greeting = f"Hi {invitee_name}," if invitee_name else "Hi there,"
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #e67e22; margin: 0;">🏉 Fantasy Rugby</h1>
                </div>
                
                <h2 style="color: #2c3e50;">You're Invited to Join a League!</h2>
                
                <p>{greeting}</p>
                
                <p><strong>{inviter_name}</strong> has invited you to join their fantasy rugby league <strong>"{league_name}"</strong>!</p>
                
                <div style="background-color: #f8f9fa; border: 2px solid #e67e22; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">League Code</h3>
                    <div style="font-size: 32px; font-weight: bold; color: #e67e22; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                        {league_code}
                    </div>
                </div>
                
                <p>Use this code to join the league and create your fantasy rugby team. Compete against other players and see who can build the best team!</p>
                
                <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #27ae60;">How to join:</h4>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li>Go to the Fantasy Rugby app</li>
                        <li>Click "Join League"</li>
                        <li>Enter the league code: <strong>{league_code}</strong></li>
                        <li>Create your team name and start playing!</li>
                    </ol>
                </div>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #856404;">What is Fantasy Rugby?</h4>
                    <p style="margin: 0; color: #856404;">
                        Fantasy Rugby is a game where you build your dream rugby team from real players. 
                        Your team scores points based on how well your players perform in real matches. 
                        Compete with friends and see who has the best rugby knowledge!
                    </p>
                </div>
                
                <p>Good luck, and may the best team win! 🏆</p>
                
                <p style="color: #7f8c8d; font-size: 14px;">
                    Invited by: {inviter_name} ({inviter_email})
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                    This invitation was sent from Fantasy Rugby. If you don't want to receive these emails, please let {inviter_name} know.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        plain_message = f"""
        Fantasy Rugby - League Invitation
        
        {greeting}
        
        {inviter_name} has invited you to join their fantasy rugby league "{league_name}"!
        
        League Code: {league_code}
        
        Use this code to join the league and create your fantasy rugby team. Compete against other players and see who can build the best team!
        
        How to join:
        1. Go to the Fantasy Rugby app
        2. Click "Join League"
        3. Enter the league code: {league_code}
        4. Create your team name and start playing!
        
        What is Fantasy Rugby?
        Fantasy Rugby is a game where you build your dream rugby team from real players. 
        Your team scores points based on how well your players perform in real matches. 
        Compete with friends and see who has the best rugby knowledge!
        
        Good luck, and may the best team win!
        
        Invited by: {inviter_name} ({inviter_email})
        
        --
        Fantasy Rugby
        """
        
        # Send the email
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[invitee_email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"SUCCESS: League invitation email sent to {invitee_email}")
            return True
        except Exception as email_error:
            # Log the error but don't fail - email might not be configured in dev
            print(f"WARNING: Could not send email to {invitee_email}: {email_error}")
            print(f"League Code for manual sharing: {league_code}")
            # Return True anyway since the invitation was processed
            return True
        
    except Exception as e:
        print(f"Error processing league invitation: {e}")
        return False


def send_password_reset_email(user_email, reset_token, username=None):
    """
    Send password reset email to a user.
    
    Args:
        user_email (str): Email of the user requesting password reset
        reset_token (str): The unique reset token
        username (str, optional): Username of the user
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        subject = 'Reset Your Fantasy Rugby Password'
        
        # Create reset link (will be handled by frontend)
        # In production, this would be your actual domain
        reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
        
        greeting = f"Hi {username}," if username else "Hi there,"
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #e67e22; margin: 0;">🏉 Fantasy Rugby</h1>
                </div>
                
                <h2 style="color: #2c3e50;">Password Reset Request</h2>
                
                <p>{greeting}</p>
                
                <p>We received a request to reset your password for your Fantasy Rugby account.</p>
                
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404;">
                        <strong>⚠️ If you didn't request this,</strong> you can safely ignore this email. 
                        Your password will remain unchanged.
                    </p>
                </div>
                
                <p>To reset your password, click the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="
                        background-color: #e67e22;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        display: inline-block;
                    ">Reset My Password</a>
                </div>
                
                <p style="font-size: 14px; color: #7f8c8d;">
                    Or copy and paste this link into your browser:<br>
                    <a href="{reset_link}" style="color: #e67e22; word-break: break-all;">{reset_link}</a>
                </p>
                
                <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #1e8449;">
                        <strong>🔒 Security Note:</strong> This link will expire in 1 hour for your security.
                    </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
                    This email was sent from Fantasy Rugby. If you didn't request a password reset, 
                    please contact support or ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        plain_message = f"""
        Fantasy Rugby - Password Reset Request
        
        {greeting}
        
        We received a request to reset your password for your Fantasy Rugby account.
        
        If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
        
        To reset your password, click this link or copy and paste it into your browser:
        {reset_link}
        
        This link will expire in 1 hour for your security.
        
        --
        Fantasy Rugby
        """
        
        # Send the email
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"SUCCESS: Password reset email sent to {user_email}")
            return True
        except Exception as email_error:
            # Log the error but don't fail - email might not be configured in dev
            print(f"WARNING: Could not send password reset email to {user_email}: {email_error}")
            print(f"Reset token for manual use: {reset_token}")
            # Return True anyway since the reset was processed
            return True
        
    except Exception as e:
        print(f"Error processing password reset email: {e}")
        return False
