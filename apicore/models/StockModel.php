<?php

require_once __DIR__ . '/BaseModel.php';

class StockModel extends BaseModel {
    public function getAllStock(): array {
        $sql = "
            SELECT 
                c.id,
                c.code,
                c.name,
                c.unit,
                COALESCE(SUM(sc.qty), 0) AS stock,
                MAX(sc.modified_on) AS last_update
            FROM commodities c
            LEFT JOIN supplier_commodities sc 
                ON sc.commodity_id = c.id 
                AND sc.deleted_on IS NULL
            WHERE c.deleted_on IS NULL
            GROUP BY c.id, c.code, c.name, c.unit
            ORDER BY c.name ASC
        ";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addLog(array $data): string {
        $stmt = $this->db->prepare("
            INSERT INTO stock_logs (supplier_id, commodity_id, direction, movement_type, qty)
            VALUES (:supplier_id, :commodity_id, :direction, :movement_type, :qty)
        ");
        $stmt->execute($data);
        return $this->db->lastInsertId();
    }

    public function getLogs(int $commodityId = null, int $supplierId = null): array {
        $sql = "
            SELECT 
                sl.*,
                c.name AS commodity_name,
                s.name AS supplier_name
            FROM stock_logs sl
            LEFT JOIN commodities c ON c.id = sl.commodity_id
            LEFT JOIN suppliers  s ON s.id = sl.supplier_id
            WHERE sl.deleted_on IS NULL
        ";

        $params = [];
        if ($commodityId) {
            $sql .= " AND sl.commodity_id = :commodity_id";
            $params[':commodity_id'] = $commodityId;
        }
        if ($supplierId) {
            $sql .= " AND sl.supplier_id = :supplier_id";
            $params[':supplier_id'] = $supplierId;
        }

        $sql .= " ORDER BY sl.created_on DESC LIMIT 150";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
