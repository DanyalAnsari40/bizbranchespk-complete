<?php

class Validator {
    public static function validateCreateBusiness(array $data): array {
        $errors = [];

        if (empty(trim($data['name'] ?? ''))) $errors[] = ['path' => ['name'], 'message' => 'Business name is required'];
        elseif (Str::len($data['name']) > 100) $errors[] = ['path' => ['name'], 'message' => 'Name too long'];

        if (empty(trim($data['category'] ?? ''))) $errors[] = ['path' => ['category'], 'message' => 'Category is required'];
        if (empty(trim($data['country'] ?? ''))) $errors[] = ['path' => ['country'], 'message' => 'Country is required'];
        if (empty(trim($data['city'] ?? ''))) $errors[] = ['path' => ['city'], 'message' => 'City is required'];
        if (empty(trim($data['address'] ?? ''))) $errors[] = ['path' => ['address'], 'message' => 'Address is required'];
        elseif (Str::len($data['address']) > 500) $errors[] = ['path' => ['address'], 'message' => 'Address too long'];

        if (empty(trim($data['phone'] ?? ''))) $errors[] = ['path' => ['phone'], 'message' => 'Phone number is required'];
        if (empty(trim($data['whatsapp'] ?? ''))) $errors[] = ['path' => ['whatsapp'], 'message' => 'WhatsApp number is required'];
        if (empty(trim($data['email'] ?? '')) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['path' => ['email'], 'message' => 'Invalid email format'];
        }

        $desc = trim($data['description'] ?? '');
        if (Str::len($desc) < 500) $errors[] = ['path' => ['description'], 'message' => 'Description must be at least 500 characters'];
        elseif (Str::len($desc) > 2000) $errors[] = ['path' => ['description'], 'message' => 'Description too long'];

        // Pakistan phone validation
        $phoneDig = preg_replace('/\D/', '', $data['phone'] ?? '');
        $whatsappDig = preg_replace('/\D/', '', $data['whatsapp'] ?? '');
        $pkPattern = '/^92[3]\d{9}$/';
        if (!preg_match($pkPattern, $phoneDig) || !preg_match($pkPattern, $whatsappDig)) {
            $errors[] = ['path' => ['phone'], 'message' => 'Phone and WhatsApp must be Pakistan numbers (+92, 10 digits starting with 3)'];
        }

        // At least one of website or facebook
        $website = trim($data['websiteUrl'] ?? '');
        $facebook = trim($data['facebookUrl'] ?? '');
        if (empty($website) && empty($facebook)) {
            $errors[] = ['path' => ['websiteUrl'], 'message' => 'At least one of Website URL or Facebook page link is required'];
        }

        // Validate URLs if provided
        foreach (['websiteUrl', 'facebookUrl', 'gmbUrl', 'youtubeUrl'] as $field) {
            $val = trim($data[$field] ?? '');
            if (!empty($val) && !filter_var($val, FILTER_VALIDATE_URL)) {
                if (!filter_var('https://' . $val, FILTER_VALIDATE_URL)) {
                    $errors[] = ['path' => [$field], 'message' => "Invalid URL for $field"];
                }
            }
        }

        if (!empty($data['postalCode']) && (Str::len($data['postalCode']) < 3 || Str::len($data['postalCode']) > 12)) {
            $errors[] = ['path' => ['postalCode'], 'message' => 'Postal code must be 3-12 characters'];
        }

        $sender = trim($data['senderName'] ?? '');
        if ($sender === '') {
            $errors[] = ['path' => ['senderName'], 'message' => 'Sender name is required'];
        } elseif (Str::len($sender) > 255) {
            $errors[] = ['path' => ['senderName'], 'message' => 'Sender name is too long'];
        }

        return $errors;
    }

    public static function validateCreateReview(array $data): array {
        $errors = [];
        if (empty(trim($data['businessId'] ?? ''))) $errors[] = ['path' => ['businessId'], 'message' => 'businessId is required'];
        if (empty(trim($data['name'] ?? ''))) $errors[] = ['path' => ['name'], 'message' => 'Name is required'];
        elseif (Str::len($data['name']) > 100) $errors[] = ['path' => ['name'], 'message' => 'Name too long'];

        $rating = (int)($data['rating'] ?? 0);
        if ($rating < 1 || $rating > 5) $errors[] = ['path' => ['rating'], 'message' => 'Rating must be between 1 and 5'];

        $comment = trim($data['comment'] ?? '');
        if (Str::len($comment) < 3) $errors[] = ['path' => ['comment'], 'message' => 'Please add a bit more detail'];
        elseif (Str::len($comment) > 1000) $errors[] = ['path' => ['comment'], 'message' => 'Comment too long'];

        return $errors;
    }
}
